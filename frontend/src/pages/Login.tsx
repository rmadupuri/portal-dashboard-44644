
import { Link } from "react-router-dom";
import SharedLayout from "@/components/SharedLayout";
import { FaGoogle, FaGithub } from "react-icons/fa";

const Login = () => {
  return (
    <SharedLayout>
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-6">Login to cBioPortal Dashboard</h1>
          <p className="text-gray-600 text-center mb-8">
            Sign in to contribute papers and datasets to cBioPortal
          </p>
          
          <div className="space-y-4">
            <button
              className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FaGoogle className="mr-2 text-red-500" />
              <span>Login with Google</span>
            </button>
            
            <button
              className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FaGithub className="mr-2" />
              <span>Login with GitHub</span>
            </button>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>By logging in, you agree to our terms of service and privacy policy.</p>
            <p className="mt-4">
              <Link to="/" className="text-blue-500 hover:underline">
                Return to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Login;
