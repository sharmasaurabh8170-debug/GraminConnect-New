import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";

function AddCrop() {
const [preview, setPreview] = useState("");
const [loading, setLoading] = useState(false);

const handleImageChange = (e) => {
const file = e.target.files[0];

if (file) {
  setPreview(URL.createObjectURL(file));
}
};

const handleSubmit = async (e) => {
e.preventDefault();

const form = e.target;
const imageFile = form.image.files[0];
const currentUser = auth.currentUser;

if (!currentUser) {
  alert("Please log in before adding a crop.");
  return;
}

if (!imageFile) {
  alert("Please select a crop image.");
  return;
}

try {
  setLoading(true);

  // 1. Get Firebase user ID and authentication token
  const farmerUID = currentUser.uid;
  const token = await currentUser.getIdToken();

  // 2. Upload image to Cloudinary
  const imageData = new FormData();
  imageData.append("file", imageFile);
  imageData.append("upload_preset", "graminconnect_upload");

  const cloudinaryResponse = await fetch(
    "https://api.cloudinary.com/v1_1/ylc3cynl/image/upload",
    {
      method: "POST",
      body: imageData,
    }
  );

  if (!cloudinaryResponse.ok) {
    throw new Error("Image upload failed.");
  }

  const cloudinaryResult = await cloudinaryResponse.json();
  const imageUrl = cloudinaryResult.secure_url;

  // 3. Prepare crop details
  const cropData = {
    farmerUID,
    name: form.name.value.trim(),
    category: form.category.value,
    price: Number(form.price.value),
    quantity: Number(form.quantity.value),
    location: form.location.value.trim(),
    description: form.description.value.trim(),
    imageUrl,
  };

  // 4. Save crop details in MongoDB
  const response = await fetch(
    "http://localhost:5000/api/crops/add",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cropData),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Could not save crop details.");
  }

  alert("Crop added successfully!");

  form.reset();
  setPreview("");
} catch (error) {
  console.error("Add Crop Error:", error);
  alert(error.message || "Something went wrong.");
} finally {
  setLoading(false);
}

};

return ( <div className="min-h-screen bg-green-50 px-4 py-10"> <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm"> <Link
       to="/farmer-dashboard"
       className="font-semibold text-green-700"
     >
← Back to Dashboard </Link>

    <h1 className="mt-5 text-3xl font-bold text-green-800">
      Add New Crop 🌱
    </h1>

    <p className="mt-2 text-gray-500">
      Provide details about the crop you want to sell.
    </p>

    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label className="mb-2 block font-semibold">
          Crop Name
        </label>
        <input
          name="name"
          type="text"
          placeholder="Fresh Tomatoes"
          required
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Category
        </label>
        <select
          name="category"
          required
          className="w-full rounded-xl border p-3"
        >
          <option value="">Select Category</option>
          <option>Vegetables</option>
          <option>Fruits</option>
          <option>Grains</option>
          <option>Pulses</option>
          <option>Other</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block font-semibold">
            Price (₹ per kg)
          </label>
          <input
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="w-full rounded-xl border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-semibold">
            Quantity (kg)
          </label>
          <input
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="w-full rounded-xl border p-3"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Farm Location
        </label>
        <input
          name="location"
          type="text"
          placeholder="Village, District or City"
          required
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Crop Description
        </label>
        <textarea
          name="description"
          rows="4"
          placeholder="Describe your crop..."
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Upload Crop Image
        </label>
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={handleImageChange}
          className="w-full rounded-xl border p-3"
        />

        {preview && (
          <img
            src={preview}
            alt="Crop Preview"
            className="mt-4 h-52 w-full rounded-xl object-cover"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Add Crop"}
      </button>
    </form>
  </div>
</div>
);
}

export default AddCrop;
