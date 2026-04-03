from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from rest_framework import status
from django.conf import settings
from google import genai
from google.genai import types
import json
import base64

class AIRateThrottle(UserRateThrottle):
    scope = 'ai_requests'

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL_NAME = "gemini-3-flash-preview"
IMAGE_MODEL_NAME = "gemini-2.0-flash-preview-image-generation"

class EvaluateWeeklyPlanView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIRateThrottle]

    def post(self, request):
        plan = request.data.get('plan')
        if not plan:
            return Response({'detail': 'Plan is required.'}, status=status.HTTP_400_BAD_REQUEST)

        system_instruction = (
            "You are a strict Endocrinologist evaluating a 7-day meal plan for a diabetic patient in the Philippines.\n"
            "For each meal provided, evaluate if it is 'good', 'warning', or 'bad' for a diabetic based on glycemic index and sugar content.\n"
            "Provide a short 1-sentence reason for your evaluation.\n"
            "Return ONLY a JSON object matching the structure of the input plan, where the value for each meal is an object with 'status' and 'reason'."
        )

        schema = {
            "type": "OBJECT",
            "properties": {
                day: {
                    "type": "OBJECT",
                    "properties": {
                        meal: {
                            "type": "OBJECT",
                            "properties": {
                                "status": {"type": "STRING"},
                                "reason": {"type": "STRING"}
                            }
                        } for meal in ["Breakfast", "Lunch", "Dinner", "Snack"]
                    }
                } for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            }
        }

        text_prompt = f"Evaluate this meal plan: {json.dumps(plan)}"

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=text_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.2,
                )
            )
            text = response.text
            if not text:
                return Response({'detail': 'No response from AI'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            text = text.replace('```json', '').replace('```', '').strip()
            return Response(json.loads(text))
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AuditRecipeView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIRateThrottle]

    def post(self, request):
        recipe_input = request.data.get('recipeInput', '')
        user_profile = request.data.get('userProfile')

        if not recipe_input:
            return Response({'detail': 'Recipe input is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(recipe_input) > 2000:
            return Response({'detail': 'Recipe input is too long. Please limit to 2000 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        import re
        sanitized_input = re.sub(r'(?i)(ignore previous instructions|system instruction|bypass|sudo)', '[redacted]', recipe_input)

        profile_context = ""
        if user_profile:
            profile_context = (
                f"\nUser Profile Context:\n"
                f"- Age: {user_profile.get('age', 'Unknown')}\n"
                f"- Diabetes Type: {user_profile.get('type', 'Unknown')}\n"
                f"- Dietary Preferences: {', '.join(user_profile.get('dietaryPreferences', [])) or 'None'}\n"
                f"- Allergens: {', '.join(user_profile.get('allergens', [])) or 'None'}\n"
                f"- Medical Restrictions: {user_profile.get('medicalDetails', {}).get('restrictions', 'None')}\n"
                f"\nCRITICAL: You MUST strictly adhere to the user's allergens and dietary preferences. Do not suggest any ingredients they are allergic to.\n"
            )

        system_instruction = (
            "You are DiaMenu's core engine, a dual-agent system designed to help Filipino diabetics manage their diet.\n"
            "Agent 1: The Doctor (Endocrinologist)\n"
            "- Strict, focuses on glycemic index, sugar content, and long-term health risks.\n"
            "- Identifies 'red flags' in ingredients (e.g., white rice, refined sugar, excessive sodium).\n"
            "Agent 2: The Chef (Filipino Home Cook)\n"
            "- Creative, practical, and culturally aware.\n"
            "- Suggests realistic 'Smart Swaps' available in a typical Philippines 'palengke' or supermarket.\n"
            "- Focuses on flavor preservation while lowering GI.\n"
            "- Suggests Adlai, Brown Rice, Cauliflower Rice, Stevia, Monkfruit, Tofu, Monggo, Malunggay, etc.\n"
            f"{profile_context}\n"
            "Your Output MUST be strictly valid JSON matching the schema provided."
        )

        schema = {
            "type": "OBJECT",
            "properties": {
                "safetyScore": {"type": "NUMBER"},
                "portionWeight": {"type": "STRING"},
                "ingredientsList": {"type": "ARRAY", "items": {"type": "STRING"}},
                "doctorAnalysis": {
                    "type": "OBJECT",
                    "properties": {
                        "verdict": {"type": "STRING"},
                        "concerns": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "glycemicIndexEstimate": {"type": "STRING"}
                    }
                },
                "chefSwaps": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "originalIngredient": {"type": "STRING"},
                            "suggestedSwap": {"type": "STRING"},
                            "reason": {"type": "STRING"},
                            "localContext": {"type": "STRING"}
                        }
                    }
                },
                "nutritionalInfo": {
                    "type": "OBJECT",
                    "properties": {
                        "calories": {"type": "NUMBER"},
                        "carbs": {"type": "NUMBER"},
                        "protein": {"type": "NUMBER"},
                        "fat": {"type": "NUMBER"}
                    }
                }
            }
        }

        text_prompt = f"Audit this recipe/meal for a Type 2 Diabetic patient in the Philippines: {sanitized_input}. Keep your analysis concise and strictly follow the JSON schema."

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=text_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.2,
                )
            )
            text = response.text
            if not text:
                return Response({'detail': 'No response from AI'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            text = text.replace('```json', '').replace('```', '').strip()
            return Response(json.loads(text))
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExtractLabResultsView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIRateThrottle]

    def post(self, request):
        base64_data = request.data.get('base64Data')
        mime_type = request.data.get('mimeType')

        if not base64_data or not mime_type:
            return Response({'detail': 'base64Data and mimeType are required.'}, status=status.HTTP_400_BAD_REQUEST)

        system_instruction = (
            "You are a medical data extraction assistant.\n"
            "Extract the following lab results from the provided image:\n"
            "1. HbA1c Level (%)\n"
            "2. Fasting Blood Sugar or Fasting Plasma Glucose (mg/dL)\n"
            "3. Total Cholesterol (mg/dL)\n"
            "Return ONLY a valid JSON object. If a value is not found, return an empty string. Only extract the numerical values and units."
        )

        schema = {
            "type": "OBJECT",
            "properties": {
                "hba1c": {"type": "STRING"},
                "fbs": {"type": "STRING"},
                "total_cholesterol": {"type": "STRING"}
            }
        }

        try:
            # Decode the base64 string directly
            image_bytes = base64.b64decode(base64_data.split(',')[-1] if ',' in base64_data else base64_data)
            
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    "Extract the lab results from this image."
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.1,
                )
            )
            text = response.text
            if not text:
                return Response({'detail': 'No response from AI'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            text = text.replace('```json', '').replace('```', '').strip()
            return Response(json.loads(text))
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateImageView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIRateThrottle]

    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'detail': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = client.models.generate_images(
                model=IMAGE_MODEL_NAME,
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio="1:1"
                )
            )
            
            if not response.generated_images:
                return Response({'detail': 'No image generated'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            image = response.generated_images[0]
            encoded_image = base64.b64encode(image.image.image_bytes).decode('utf-8')
            
            return Response({'image': f"data:{image.image.mime_type};base64,{encoded_image}"})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RecipeChatView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIRateThrottle]

    def post(self, request):
        history = request.data.get('history', [])
        message = request.data.get('message', '')
        settings_data = request.data.get('settings')

        if not message:
            return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        system_instruction = (
            "You are a helpful culinary AI assistant specializing in diabetic-friendly Filipino cuisine.\n"
            "Help the user brainstorm recipe ideas or modify existing recipes based on their input.\n"
        )
        
        if settings_data:
            system_instruction += (
                f"\nUser Preferences:\n"
                f"- Servings: {settings_data.get('servings', '2')}\n"
                f"- Cuisine: {settings_data.get('country', 'Philippines')}\n"
                f"- Dietary Options: {', '.join(settings_data.get('dietaryOptions', [])) or 'None'}\n"
                f"- Allergies: {', '.join(settings_data.get('allergies', [])) or 'None'}\n"
                f"- Ingredients to Avoid: {', '.join(settings_data.get('ingredientsToAvoid', [])) or 'None'}\n"
                f"ALWAYS adhere to these allergies and ingredients to avoid!"
            )

        contents = []
        for msg in history:
            role = "user" if msg.get("sender") == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(msg.get("text", ""))]))
            
        contents.append(types.Content(role="user", parts=[types.Part.from_text(message)]))

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                )
            )
            return Response({'text': response.text})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckTopicView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIRateThrottle]

    def post(self, request):
        message = request.data.get('message')
        if not message:
            return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        system_instruction = (
            "You are a topic classifier for a diabetes-friendly cooking assistant called 'Doc Chef'.\n"
            "Your ONLY job is to decide whether the user's message is related to ANY of these topics:\n"
            "- Food, cooking, or recipes\n"
            "- Nutrition or dietary needs\n"
            "- Diabetes-friendly meals or ingredients\n"
            "- Meal planning or food swaps\n"
            "- Specific dishes, cuisines, or food ingredients\n"
            f"User message: \"{message}\"\n"
            "Respond with a single JSON object: { \"on_topic\": true } if it IS related, or { \"on_topic\": false } if it is NOT related (e.g. web browsing, coding, general knowledge, news, etc.)."
        )
        
        schema = {
            "type": "OBJECT",
            "properties": {
                "on_topic": {"type": "BOOLEAN"}
            }
        }

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=message,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.1,
                )
            )
            text = response.text
            if not text:
                return Response({'detail': 'No response from AI'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            text = text.replace('```json', '').replace('```', '').strip()
            return Response(json.loads(text))
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SmartSwapView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIRateThrottle]

    def post(self, request):
        prompt = request.data.get('prompt')
        if not prompt:
            return Response({'detail': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)

        schema = {
            "type": "OBJECT",
            "properties": {
                "message": {
                    "type": "STRING",
                    "description": "A friendly message explaining the smart swaps made based on the user's profile."
                },
                "recipes": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "title": {"type": "STRING"},
                            "description": {"type": "STRING"},
                            "tags": {"type": "ARRAY", "items": {"type": "STRING"}},
                            "ingredients": {"type": "ARRAY", "items": {"type": "STRING"}},
                            "preparation": {"type": "ARRAY", "items": {"type": "STRING"}},
                            "instructions": {"type": "ARRAY", "items": {"type": "STRING"}}
                        }
                    }
                }
            }
        }

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.7,
                )
            )
            text = response.text
            if not text:
                return Response({'detail': 'No response from AI'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            text = text.replace('```json', '').replace('```', '').strip()
            return Response(json.loads(text))
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
