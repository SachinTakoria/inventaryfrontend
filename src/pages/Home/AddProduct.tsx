import React, { useState } from "react";
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

    // ✅ Handle Image Selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImage(e.target.files);
        }
    };

    // ✅ Handle Form Submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("productName", productName);
        formData.append("price", price.toString()); // ✅ Convert to String
        formData.append("category", category);
        formData.append("brand", brand);
        formData.append("stock", stock.toString()); // ✅ Convert to String
        formData.append("warehouse", warehouse);
        formData.append("supplier", supplier);
        formData.append("status", status);

        // ✅ Append Image (Ensure only one image for now)
        if (image && image.length > 0) {
            formData.append("images", image[0]); // ✅ First Image Append
        }

        try {
            const response = await axios.post("http://localhost:8000/api/v1/products", formData, {
                headers: { "Content-Type": "multipart/form-data" }, // ✅ Fix: Use correct content type
            });

            if (response.status === 201) {
                alert("✅ Product Added Successfully!");
                setProductName("");
                setPrice("");
                setCategory("");
                setBrand("");
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
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required>
              <option value="">Choose Category</option>
              <option value="Sarees">Sarees</option>
              <option value="Dress Material">Dress Material</option>
            </select>
          </div>
      
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-600">Brand*</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" required />
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
      </div>
      

    );
};

export default AddProduct;
