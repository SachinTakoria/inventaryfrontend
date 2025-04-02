import React, { useEffect, useState } from "react";
import axios from "axios";

const AddProduct = () => {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [stock, setStock] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState("Received");
  const [image, setImage] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receivedStock, setReceivedStock] = useState("");
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/categories`, { name: newCategory });
      setNewCategory("");
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert("Category already exists or failed to add.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert("Failed to delete category.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("price", price.toString());
    formData.append("category", category);
    formData.append("brand", brand);
    formData.append("receivedStock", receivedStock.toString());

    formData.append("stock", stock.toString());
    formData.append("warehouse", warehouse);
    formData.append("supplier", supplier);
    formData.append("status", status);

    if (image && image.length > 0) {
      formData.append("images", image[0]);
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/products`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        alert("✅ Product Added Successfully!");
        setProductName("");
        setPrice("");
        setCategory("");
        setBrand("");
        setReceivedStock("")
        setStock("");
        setWarehouse("");
        setSupplier("");
        setStatus("Received");
        setImage(null);
      }
    } catch (error) {
      setError("❌ Failed to add product. Try again!");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-semibold mb-4 text-center text-gray-700 relative">
        Add New Product
        <span className="block w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mt-1 rounded-full"></span>
      </h2>

      {error && <p className="text-red-500 text-center text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-600">Product Name*</label>
          <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">Product Category*</label>
          <div className="flex items-center gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required>
              <option value="">Choose Category</option>
              {categories.map((cat: any) => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowModal(true)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">+ Add</button>
          </div>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">Brand*</label>
          <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required />
        </div>

        <div>
  <label className="block mb-1 text-sm font-medium text-gray-600">Received Stock*</label>
  <input
    type="number"
    value={receivedStock}
    onChange={(e) => setReceivedStock(e.target.value)}
    className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
    required
  />
</div>


        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">Stock Quantity*</label>
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">Price*</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">Warehouse*</label>
          <input type="text" value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">Supplier*</label>
          <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">Status*</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required>
            <option value="Received">Received</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">Upload Product Images</label>
          <input type="file" multiple onChange={handleImageChange} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required />
        </div>

        <div className="col-span-2 flex justify-center">
          <button type="submit" className="px-5 py-2 my-8 bg-blue-600 text-white text-sm rounded-md shadow-sm hover:bg-blue-700 transition duration-200" disabled={loading}>
            {loading ? "Adding..." : "Add Product"}
          </button>
        </div>
      </form>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[90%] max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="w-full p-2 mb-4 border border-gray-300 rounded"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-1 bg-gray-400 text-white rounded">Cancel</button>
              <button onClick={handleAddCategory} className="px-4 py-1 bg-blue-600 text-white rounded">Save</button>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Categories:</h4>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {categories.map((cat: any) => (
                  <li key={cat._id} className="flex justify-between items-center text-sm bg-gray-100 px-2 py-1 rounded">
                    {cat.name}
                    <button onClick={() => handleDeleteCategory(cat._id)} className="text-red-500 text-xs hover:underline">Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;