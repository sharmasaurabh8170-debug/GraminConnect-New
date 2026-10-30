import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  ShoppingBasket,
  Leaf,
  LogOut,
  RefreshCw,
} from "lucide-react";

function CustomerDashboard() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const fetchCrops = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/crops");

      if (!response.ok) {
        throw new Error("Unable to fetch crops");
      }

      const data = await response.json();
      setCrops(data);
    } catch (err) {
      setError("Could not load crops. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const categories = [
    "All",
    ...new Set(crops.map((crop) => crop.category)),
  ];

  const filteredCrops = crops.filter((crop) => {
    const matchesSearch =
      crop.name.toLowerCase().includes(search.toLowerCase()) ||
      crop.location.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || crop.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F4FAF1]">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="text-green-600" size={30} />
          <span className="text-2xl font-bold text-green-800">
            GraminConnect
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchCrops}
            className="flex items-center gap-2 text-green-700 hover:text-green-900"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <LogOut size={18} />
            Home
          </Link>
        </div>
      </nav>

      {/* Heading */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-green-900">
          Fresh Crops From Farmers 🌱
        </h1>

        <p className="text-gray-600 mt-2">
          Explore fresh agricultural products directly from farmers.
        </p>

        {/* Search */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm flex-1">
            <Search className="text-gray-400" />
            <input
              type="text"
              placeholder="Search crops or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none ml-3"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white px-5 py-3 rounded-xl shadow-sm outline-none"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Crop Listing */}
      <section className="max-w-7xl mx-auto px-6 pb-16">

        {loading ? (
          <p className="text-center text-green-700 py-12">
            Loading fresh crops...
          </p>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchCrops}
              className="bg-green-600 text-white px-5 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBasket
              size={55}
              className="mx-auto text-green-400 mb-4"
            />
            <h2 className="text-2xl font-bold text-green-900">
              No Crops Found
            </h2>
            <p className="text-gray-500 mt-2">
              Try another search or check back later.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-green-900 mb-6">
              Available Crops ({filteredCrops.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
              {filteredCrops.map((crop) => (
                <div
                  key={crop._id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition"
                >
                  <img
                    src={crop.imageUrl || "https://placehold.co/600x400?text=Crop"}
                    alt={crop.name}
                    className="w-full h-52 object-cover"
                  />

                  <div className="p-5">
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      {crop.category}
                    </span>

                    <h3 className="text-xl font-bold text-gray-800 mt-3 capitalize">
                      {crop.name}
                    </h3>

                    <p className="text-green-700 text-2xl font-bold mt-2">
                      ₹{crop.price}
                      <span className="text-sm text-gray-500 font-normal">
                        {" "} / unit
                      </span>
                    </p>

                    <p className="text-gray-600 mt-3">
                      Quantity: {crop.quantity}
                    </p>

                    <p className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                      <MapPin size={16} />
                      {crop.location}
                    </p>

                    <p className="text-gray-600 text-sm mt-3">
                      {crop.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default CustomerDashboard;