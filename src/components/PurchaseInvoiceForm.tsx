import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface Product {
  _id: string;
  productName: string;
}

interface InvoiceItem {
  product: string;
  quantity: number;
  price: number;
  remark: string;
}

const PurchaseInvoiceForm = ({ setRefreshInvoices, refreshProducts }: { setRefreshInvoices: (value: boolean) => void, refreshProducts: () => void }) => {


    const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [gstType, setGstType] = useState("without"); // Default: without gst
const [gstRate, setGstRate] = useState(5); // Default: 5% gst

  const [newInvoice, setNewInvoice] = useState({
    supplier: "",
    invoiceNumber: "",
    date: "",
    items: [{ product: "", quantity: 0, price: 0, remark: "" }],
  });

  // Fetch all products for dropdown
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/products/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, index?: number) => {
    const { name, value } = e.target;
    if (typeof index === "number") {
      const updatedItems = [...newInvoice.items];
      updatedItems[index][name] = value;
      setNewInvoice({ ...newInvoice, items: updatedItems });
    } else {
      setNewInvoice({ ...newInvoice, [name]: value });
    }
  };

  const addItemRow = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { product: "", quantity: 0, price: 0, remark: "" }],
    });
  };

  const removeItemRow = (index: number) => {
    const updatedItems = [...newInvoice.items];
    updatedItems.splice(index, 1);
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const handleSubmitInvoice = async () => {
    setIsSubmitting(true); // ✅ Start spinner
  
    try {
      // ✅ Validate all items before API call
      for (const item of newInvoice.items) {
        if (!item.product || !item.quantity || Number(item.quantity) <= 0) {
          toast.error("❌ Please fill all Product and Quantity fields properly!");
          setIsSubmitting(false);
          return;
        }
      }
  
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/purchase-invoice/create`, {
        ...newInvoice,
        gstType,   // ✅ add gstType
        gstRate,   // ✅ add gstRate
      });
  
      toast.success("✅ Invoice Created Successfully!");
  
      setRefreshInvoices(prev => !prev);
      setTimeout(() => {
        refreshProducts();
      }, 500);
  
      setNewInvoice({
        supplier: "",
        invoiceNumber: "",
        date: "",
        items: [{ product: "", quantity: 0, price: 0, remark: "" }],
      });
    } catch (err) {
      console.error("Failed to create invoice:", err);
      toast.error("❌ Failed to create invoice!");
    } finally {
      setIsSubmitting(false); // ✅ Stop spinner
    }
  };
  
  
  

  // Live Total
  const baseAmount = newInvoice.items.reduce((sum, item) => {
    return sum + (Number(item.quantity) * Number(item.price));
  }, 0);
  
  const gstAmount = gstType === "with" ? (baseAmount * gstRate) / 100 : 0;
  const totalAmount = baseAmount + gstAmount;
  

  return (
    <div className="bg-white p-6 rounded shadow mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🧾 Add New Purchase Invoice</h2>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
  <input
    type="text"
    name="supplier"
    value={newInvoice.supplier}
    onChange={handleInvoiceChange}
    placeholder="Supplier Name"
    className="border p-2 rounded text-sm"
  />
  <input
    type="text"
    name="invoiceNumber"
    value={newInvoice.invoiceNumber}
    onChange={handleInvoiceChange}
    placeholder="Invoice Number"
    className="border p-2 rounded text-sm"
  />
  <input
    type="date"
    name="date"
    value={newInvoice.date}
    onChange={handleInvoiceChange}
    className="border p-2 rounded text-sm"
  />

  {/* GST Type Dropdown */}
  <select
    value={gstType}
    onChange={(e) => setGstType(e.target.value)}
    className="border p-2 rounded text-sm"
  >
    <option value="without">Without GST</option>
    <option value="with">With GST</option>
  </select>

  {/* GST Rate Dropdown - Visible only if 'with' GST */}
  {gstType === "with" && (
    <select
      value={gstRate}
      onChange={(e) => setGstRate(Number(e.target.value))}
      className="border p-2 rounded text-sm"
    >
      <option value={5}>5%</option>
      <option value={9}>9%</option>
      <option value={12}>12%</option>
      <option value={18}>18%</option>
    </select>
  )}
</div>


      <div className="overflow-x-auto">
        <table className="w-full text-sm border mb-4">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Remark</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {newInvoice.items.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">
                  <select
                    name="product"
                    value={item.product}
                    onChange={(e) => handleInvoiceChange(e, index)}
                    className="border p-1 w-full rounded text-sm"
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.productName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleInvoiceChange(e, index)}
                    className="border p-1 w-full rounded text-sm"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    name="price"
                    value={item.price}
                    onChange={(e) => handleInvoiceChange(e, index)}
                    className="border p-1 w-full rounded text-sm"
                  />
                </td>
                <td className="p-2">
                  <input
                    name="remark"
                    value={item.remark}
                    onChange={(e) => handleInvoiceChange(e, index)}
                    className="border p-1 w-full rounded text-sm"
                  />
                </td>
                <td className="text-center">
                  <button
                    onClick={() => removeItemRow(index)}
                    className="text-red-600 hover:text-red-800 text-lg"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={addItemRow}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm shadow"
        >
          + Add Product
        </button>

        <div className="text-right font-semibold text-lg text-gray-700">
  <div>Subtotal: ₹{baseAmount.toFixed(2)}</div>
  {gstType === "with" && (
    <div>GST ({gstRate}%): ₹{gstAmount.toFixed(2)}</div>
  )}
  <div className="mt-1">Grand Total: ₹{totalAmount.toFixed(2)}</div>
</div>

      </div>

      <button
  onClick={handleSubmitInvoice}
  disabled={isSubmitting}
  className={`bg-green-600 hover:bg-green-700 text-white px-6 py-2 mt-6 rounded text-lg font-bold w-full ${
    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  {isSubmitting ? "Processing..." : "✅ Submit Invoice"}
</button>

    </div>
  );
};

export default PurchaseInvoiceForm;
