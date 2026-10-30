import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function FarmerDashboard() {
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/crops");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        setTotalProducts(data.length);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-800">
              Farmer Dashboard 🌾
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your crops and grow your business.
            </p>
          </div>

          <Link
            to="/"
            className="rounded-lg border border-green-600 px-5 py-2 text-green-700"
          >
            Back to Home
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-5 sm:grid-cols-3">

          {/* Total Products */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-gray-500">Total Products</h2>

            <p className="mt-3 text-3xl font-bold text-green-700">
              {loading ? "..." : totalProducts}
            </p>
          </div>

          {/* Total Orders */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-gray-500">Total Orders</h2>

            <p className="mt-3 text-3xl font-bold text-green-700">
              0
            </p>
          </div>

          {/* Active Listings */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-gray-500">Active Listings</h2>

            <p className="mt-3 text-3xl font-bold text-green-700">
              {loading ? "..." : totalProducts}
            </p>
          </div>

        </div>

        {/* Add Crop */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-green-800">
            Manage Your Crops
          </h2>

          <p className="mt-2 text-gray-600">
            Add your fresh farm products to GraminConnect.
          </p>

          <Link
            to="/add-crop"
            className="mt-6 inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            + Add New Crop
          </Link>
        </div>

      </div>
    </div>
  );
}

export default FarmerDashboard;