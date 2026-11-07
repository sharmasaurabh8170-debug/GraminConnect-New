import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
Sprout,
Mail,
Lock,
Eye,
EyeOff,
ArrowLeft,
} from "lucide-react";

import {
signInWithEmailAndPassword,
GoogleAuthProvider,
signInWithPopup,
sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "../firebase";

export default function Login() {
const navigate = useNavigate();

const [showPassword, setShowPassword] = useState(false);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);

// Get user profile from MongoDB
const redirectUser = async (firebaseUser) => {
const token = await firebaseUser.getIdToken();

const response = await fetch(
  "https://graminconnect-new.onrender.com/api/users/profile",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();

if (!response.ok) {
  if (response.status === 404) {
    throw new Error(
      "Your account exists, but your GraminConnect profile is missing. Please complete your profile first."
    );
  }

  throw new Error(data.message || "Unable to load your profile.");
}

if (data.user.role === "farmer") {
  navigate("/farmer-dashboard");
} else if (data.user.role === "customer") {
  navigate("/customer-dashboard");
} else {
  throw new Error("Invalid account type.");
}

};

// Email Login
const handleSubmit = async (e) => {
e.preventDefault();

try {
  setLoading(true);

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  await redirectUser(userCredential.user);

} catch (error) {
  console.error("Login Error:", error);

  if (
    error.code === "auth/invalid-credential" ||
    error.code === "auth/user-not-found" ||
    error.code === "auth/wrong-password"
  ) {
    alert("Invalid email or password.");
  } else if (error.code === "auth/invalid-email") {
    alert("Please enter a valid email address.");
  } else {
    alert(error.message);
  }

} finally {
  setLoading(false);
}

};

// Google Login
const handleGoogleLogin = async () => {
try {
setLoading(true);

  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);

  await redirectUser(result.user);

} catch (error) {
  console.error("Google Login Error:", error);

  if (error.code === "auth/popup-closed-by-user") {
    alert("Google login was cancelled.");
  } else {
    alert(error.message);
  }

} finally {
  setLoading(false);
}
};

// Forgot Password
const handleForgotPassword = async () => {
if (!email) {
alert("Please enter your email address first.");
return;
}

try {
  await sendPasswordResetEmail(auth, email);
  alert("Password reset email sent! Check your inbox.");

} catch (error) {
  console.error("Password Reset Error:", error);
  alert(error.message);
}
};

return ( <div className="min-h-screen bg-[#F4FAF1] flex items-center justify-center p-4">

```
  <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-7 sm:p-9">

    <Link
      to="/"
      className="inline-flex items-center gap-2 text-gray-500 hover:text-green-700 mb-7"
    >
      <ArrowLeft size={18} />
      Back to Home
    </Link>

    <div className="text-center mb-8">

      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
        <Sprout size={34} className="text-green-700" />
      </div>

      <h1 className="text-3xl font-bold text-[#1B2E1B]">
        Welcome Back!
      </h1>

      <p className="text-gray-500 mt-2">
        Login to your GraminConnect account
      </p>

    </div>

    {/* Email Login */}

    <form onSubmit={handleSubmit}>

      <div className="mb-5">

        <label className="block font-medium mb-2 text-gray-700">
          Email Address
        </label>

        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:border-green-600">

          <Mail size={19} className="text-gray-400 mr-3" />

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full outline-none"
            required
          />

        </div>

      </div>

      <div className="mb-3">

        <label className="block font-medium mb-2 text-gray-700">
          Password
        </label>

        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:border-green-600">

          <Lock size={19} className="text-gray-400 mr-3" />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full outline-none"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>

        </div>

      </div>

      <div className="text-right mb-6">

        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-green-700 font-semibold hover:underline"
        >
          Forgot Password?
        </button>

      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold transition"
      >
        {loading ? "Please wait..." : "Login with Email"}
      </button>

    </form>

    {/* Divider */}

    <div className="flex items-center gap-4 my-6">

      <div className="h-px bg-gray-200 flex-1"></div>

      <span className="text-gray-400 text-sm">OR</span>

      <div className="h-px bg-gray-200 flex-1"></div>

    </div>

    {/* Google Login */}

    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full border border-gray-200 hover:bg-gray-50 disabled:opacity-60 py-3 rounded-xl flex items-center justify-center gap-3 font-medium text-gray-700"
    >

      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
      />

      Continue with Google

    </button>

    <p className="text-center text-gray-500 mt-7">

      Don't have an account?{" "}

      <Link
        to="/register"
        className="text-green-700 font-semibold"
      >
        Create Account
      </Link>

    </p>

  </div>

</div>
);
}
