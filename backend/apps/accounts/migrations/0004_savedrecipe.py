# Generated manually for SavedRecipe model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_registrationotp'),
    ]

    operations = [
        migrations.CreateModel(
            name='SavedRecipe',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('tags', models.JSONField(blank=True, default=list)),
                ('ingredients', models.JSONField(blank=True, default=list)),
                ('preparation', models.JSONField(blank=True, default=list)),
                ('instructions', models.JSONField(blank=True, default=list)),
                ('servings', models.CharField(default='2 people', max_length=50)),
                ('country', models.CharField(default='Philippines', max_length=100)),
                ('dietary_options', models.JSONField(blank=True, default=list)),
                ('allergies', models.JSONField(blank=True, default=list)),
                ('ingredients_to_avoid', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_recipes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='savedrecipe',
            unique_together={('user', 'title')},
        ),
    ]