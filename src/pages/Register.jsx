import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
Sprout,
User,
Mail,
Lock,
Eye,
EyeOff,
ArrowLeft,
} from "lucide-react";

import {
createUserWithEmailAndPassword,
GoogleAuthProvider,
signInWithPopup,
updateProfile,
} from "firebase/auth";

import { auth } from "../firebase";

export default function Register() {
const navigate = useNavigate();

const [role, setRole] = useState("customer");
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);

// Save user profile in MongoDB
const saveUserProfile = async (firebaseUser, userName, userRole) => {
const token = await firebaseUser.getIdToken();

const response = await fetch(
  "http://localhost:5000/api/users/profile",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: userName,
      role: userRole,
    }),
  }
);

const data = await response.json();

if (!response.ok) {
  throw new Error(data.message || "Could not save user profile");
}

return data;

};

// Navigate according to account type
const redirectUser = (userRole) => {
if (userRole === "farmer") {
navigate("/farmer-dashboard");
} else {
navigate("/customer-dashboard");
}
};

// Email Registration
const handleRegister = async (e) => {
e.preventDefault();

try {
  setLoading(true);

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await updateProfile(userCredential.user, {
    displayName: name,
  });

  await saveUserProfile(userCredential.user, name, role);

  alert("Account created successfully!");

  redirectUser(role);

} catch (error) {
  console.error("Registration Error:", error);

  if (error.code === "auth/email-already-in-use") {
    alert("This email is already registered.");
  } else if (error.code === "auth/weak-password") {
    alert("Please choose a stronger password.");
  } else if (error.code === "auth/invalid-email") {
    alert("Please enter a valid email.");
  } else {
    alert(error.message);
  }

} finally {
  setLoading(false);
}

};

// Google Registration
const handleGoogleRegister = async () => {
try {
setLoading(true);

  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);

  const googleUser = result.user;

  const userName =
    googleUser.displayName ||
    googleUser.email?.split("@")[0] ||
    "GraminConnect User";

  await saveUserProfile(googleUser, userName, role);

  alert("Google account connected successfully!");

  redirectUser(role);

} catch (error) {
  console.error("Google Registration Error:", error);
  alert(error.message);

} finally {
  setLoading(false);
}

};

return ( <div className="min-h-screen bg-[#F4FAF1] flex items-center justify-center p-4">

  <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-7 sm:p-9">

    <Link
      to="/"
      className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-green-700"
    >
      <ArrowLeft size={18} />
      Back to Home
    </Link>

    <div className="text-center mb-7">

      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
        <Sprout size={34} className="text-green-700" />
      </div>

      <h1 className="text-3xl font-bold text-[#1B2E1B]">
        Create Account
      </h1>

      <p className="text-gray-500 mt-2">
        Join the GraminConnect community
      </p>

    </div>

    <form onSubmit={handleRegister} className="space-y-4">

      {/* Full Name */}

      <div>
        <label className="block font-medium mb-2 text-gray-700">
          Full Name
        </label>

        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3">
          <User size={19} className="text-gray-400 mr-3" />

          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full outline-none"
            required
          />
        </div>
      </div>

      {/* Email */}

      <div>
        <label className="block font-medium mb-2 text-gray-700">
          Email Address
        </label>

        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3">
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

      {/* Password */}

      <div>
        <label className="block font-medium mb-2 text-gray-700">
          Password
        </label>

        <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3">

          <Lock size={19} className="text-gray-400 mr-3" />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            minLength="8"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full outline-none"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400"
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>

        </div>
      </div>

      {/* Account Type */}

      <div>
        <label className="block font-medium mb-3 text-gray-700">
          Select Account Type
        </label>

        <div className="grid grid-cols-2 gap-3">

          <button
            type="button"
            onClick={() => setRole("farmer")}
            className={`p-4 rounded-xl border ${
              role === "farmer"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-200 text-gray-600"
            }`}
          >
            <div className="text-2xl mb-1">🧑‍🌾</div>
            <div className="font-semibold">Farmer</div>
          </button>

          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`p-4 rounded-xl border ${
              role === "customer"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-200 text-gray-600"
            }`}
          >
            <div className="text-2xl mb-1">🛒</div>
            <div className="font-semibold">Customer</div>
          </button>

        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold transition"
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>

    </form>

    {/* Divider */}

    <div className="flex items-center gap-4 my-5">
      <div className="h-px bg-gray-200 flex-1"></div>
      <span className="text-gray-400 text-sm">OR</span>
      <div className="h-px bg-gray-200 flex-1"></div>
    </div>

    {/* Google Registration */}

    <button
      type="button"
      onClick={handleGoogleRegister}
      disabled={loading}
      className="w-full border border-gray-200 hover:bg-gray-50 disabled:opacity-60 py-3 rounded-xl flex items-center justify-center gap-3 font-medium text-gray-700"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
      />

      Sign up with Google
    </button>

    <p className="text-center text-gray-500 mt-6">
      Already have an account?{" "}
      <Link
        to="/login"
        className="text-green-700 font-semibold"
      >
        Login
      </Link>
    </p>

  </div>
</div>
);
}
