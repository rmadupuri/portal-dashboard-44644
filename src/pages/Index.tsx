import { Link } from "react-router-dom";
import { ArrowRight, Database, TrendingUp, Users } from "lucide-react";
import SharedLayout from "@/components/SharedLayout";
import AnalyticsPreview from "@/components/home/AnalyticsPreview";

const Index = () => {
  return (
    <SharedLayout>
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 min-h-screen">
        {/* Hero Section */}
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto text-center">
            {/* Main Hero Content */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-800 leading-tight">
                <span className="block text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text mt-2">
                  cBioPortal Data Contribution Dashboard
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Join the global scientific community in advancing cancer genomics research. 
                Contribute your data and publications to <strong>cBioPortal</strong> and help researchers worldwide make breakthrough discoveries.
              </p>
            </div>

            {/* Value Propositions - Now with merged card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
              <Link 
                to="/submit"
                className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <Database className="h-10 w-10 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-800 mb-3 text-lg">Submit Data to cBioPortal</h3>
                <p className="text-sm text-slate-600 mb-4">Submit cancer genomics datasets or suggest publications for curation and inclusion in the portal</p>
                <div className="flex items-center justify-center text-blue-600 font-medium text-sm">
                  Submit <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              
              <Link 
                to="/track-status"
                className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <TrendingUp className="h-10 w-10 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-800 mb-3 text-lg">Track Progress</h3>
                <p className="text-sm text-slate-600 mb-4">Monitor your submissions through our transparent curation pipeline</p>
                <div className="flex items-center justify-center text-green-600 font-medium text-sm">
                  View Status <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto px-4 sm:px-6 pb-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Analytics Preview - more prominent */}
            <AnalyticsPreview />

            {/* Community Impact Footer */}
            <div className="bg-gradient-to-r from-slate-100 to-blue-50 rounded-2xl p-8 text-center border border-slate-200">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Users className="h-7 w-7 text-blue-600" />
                <h3 className="text-xl font-semibold text-slate-800">Join Our Research Community</h3>
              </div>
              <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
                Be part of a collaborative network of researchers, clinicians, and data scientists 
                working together to unlock new insights in cancer genomics and accelerate the development 
                of precision medicine approaches.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Index;
