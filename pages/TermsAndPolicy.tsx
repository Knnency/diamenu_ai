import React from 'react';
import { ViewState } from '../types';
import { APP_NAME } from '../constants';

interface TermsAndPolicyProps {
  changeView: (view: ViewState) => void;
}

const TermsAndPolicy: React.FC<TermsAndPolicyProps> = ({ changeView }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 lg:px-8 space-y-12 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Terms & Privacy Policy
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Content Sections */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8 md:p-12 space-y-8">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-emerald-400 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-primary text-sm font-bold">1</span>
              Introduction
            </h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-4">
              <p>
                Welcome to {APP_NAME}. These Terms and Privacy Policy govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms.
              </p>
              <p>
                {APP_NAME} is designed to provide nutritional guidance and AI-driven recipe auditing for individuals managing diabetes. Our platform is a tool for information and convenience, not a replacement for professional healthcare.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-emerald-400 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-primary text-sm font-bold">2</span>
              Medical Disclaimer
            </h2>
            <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-6 rounded-r-xl">
              <div className="flex gap-4 text-amber-900 dark:text-amber-200">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="space-y-2 text-sm md:text-base">
                  <p className="font-bold">IMPORTANT: NOT MEDICAL ADVICE</p>
                  <p>
                    Information provided on {APP_NAME} is for educational and informational purposes only. It is NOT intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-emerald-400 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-primary text-sm font-bold">3</span>
              Privacy & Data Usage
            </h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-4">
              <p>
                We respect your privacy. Here is how we handle your information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Data:</strong> We store your name and email to provide a personalized experience and save your preferences.</li>
                <li><strong>Health Profiles:</strong> Information about your diabetes type, allergens, and dietary preferences is stored locally and used by our AI to provide relevant context.</li>
                <li><strong>Anonymous Analytics:</strong> We may collect anonymous usage data to improve our services.</li>
                <li><strong>No Sharing:</strong> We do not sell or share your personal data with third-party advertisers.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-emerald-400 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-primary text-sm font-bold">4</span>
              AI Limitations
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Our recipe auditor and meal planning features use Artificial Intelligence. While highly advanced, AI can produce errors or "hallucinations." Users should always exercise common sense and double-check ingredient safety against their personal medical restrictions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-emerald-400 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-primary text-sm font-bold">5</span>
              Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have any questions about these terms, please contact us at <a href="mailto:support@diamenu.online" className="text-primary hover:underline font-semibold">support@diamenu.online</a>.
            </p>
          </section>

        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 p-8 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            By using this website, you acknowledge that you have read and understood these terms.
          </div>
          <button 
            onClick={() => changeView(ViewState.HOME)}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndPolicy;
