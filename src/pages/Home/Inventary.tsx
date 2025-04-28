import {useEffect,  useState } from "react";
import axios from "axios";
// import { ChevronDown, ChevronUp } from "lucide-react";
// import moment from "moment";
import PurchaseInvoiceForm from "../../components/PurchaseInvoiceForm";
import PurchaseInvoiceList from "../../components/PurchaseInvoiceList"; 



const Inventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [refreshInvoices, setRefreshInvoices] = useState(false);

  // const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  // const [purchaseHistory, setPurchaseHistory] = useState<Record<string, any[]>>({});
  // const [newPurchase, setNewPurchase] = useState({
  //   supplier: "",
  //   quantity: 0,
  //   price: 0,
  //   date: "",
  //   remark: "",
  // });
  // const [addingFor, setAddingFor] = useState<string | null>(null);
  // const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/products/products`
      );
      setProducts(data);
    } catch (err) {
     
    }
  };

  // const fetchPurchaseHistory = async (productId: string) => {
  //   try {
  //     const res = await axios.get(
  //       `${import.meta.env.VITE_BACKEND_URL}/purchases/product/${productId}`
  //     );
  //     const sorted = res.data.sort(
  //       (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  //     );
  //     setPurchaseHistory((prev) => ({ ...prev, [productId]: sorted }));
  //   } catch (err) {
     
  //   }
  // };

  // const toggleExpand = async (productId: string) => {
  //   if (expandedProductId === productId) {
  //     setExpandedProductId(null);
  //   } else {
  //     setExpandedProductId(productId);
  //     await fetchPurchaseHistory(productId);
  //   }
  // };

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setNewPurchase({ ...newPurchase, [e.target.name]: e.target.value });
  // };

  // const handleAddPurchase = async (productId: string) => {
  //   try {
  //     await axios.post(`${import.meta.env.VITE_BACKEND_URL}/purchases`, {
  //       ...newPurchase,
  //       product: productId,
  //     });
  
  //     // Clear form
  //     setNewPurchase({ supplier: "", quantity: 0, price: 0, date: "", remark: "" });
  //     setAddingFor(null);
  
  //     // Refetch updated product list
  //     await fetchProducts();  // yahi stock ko refresh kar dega UI me
  
  //     // Also refetch updated purchase history
  //     await fetchPurchaseHistory(productId);
  //   } catch (err) {
  
  //   }
  // };
  
  

  // const filteredProducts = products.filter((product) =>
  //   product.productName.toLowerCase().includes(search.toLowerCase()) ||
  //   product.category.toLowerCase().includes(search.toLowerCase())
  // );


  // const handleDeletePurchase = async (purchaseId: string, productId: string, quantity: number) => {
  //   const confirm = window.confirm("Are you sure you want to delete this purchase?");
  //   if (!confirm) return;
  
  //   try {
  //     await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/purchases/${purchaseId}`);
  //     await fetchProducts();
  //     await fetchPurchaseHistory(productId);
  //   } catch (err) {
     
  //   }
  // };
  
  

  return (
    <div className="p-4">
  <PurchaseInvoiceForm setRefreshInvoices={setRefreshInvoices} refreshProducts={fetchProducts} />


       <PurchaseInvoiceList refreshInvoices={refreshInvoices} />


      {/* <h1 className="text-2xl font-semibold text-gray-700 mb-4">📦 Inventory Overview</h1>

      <input
        type="text"
        placeholder="Search by name or category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 p-2 border rounded w-full max-w-sm"
      />

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
            <th className="p-3">S.No</th>
            <th className="p-3">Name</th>
            <th className="p-3">Category</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Avg Price</th>
            <th className="p-3">Last Updated</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product, index) => (
            <>
              <tr key={product._id} className="border-b hover:bg-gray-50">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{product.productName}</td>
                <td className="p-3">{product.category}</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">₹{product.avgPurchasePrice?.toFixed(2) || "0.00"}</td>
                <td className="p-3">
                  {product.updatedAt ? moment(product.updatedAt).fromNow() : "Not updated"}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleExpand(product._id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {expandedProductId === product._id ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </td>
              </tr>

              {expandedProductId === product._id && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="p-5">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Purchase History</h3>
                    <table className="min-w-full text-sm border rounded overflow-hidden mb-4">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="p-2 text-left">Supplier</th>
                          <th className="p-2 text-left">Quantity</th>
                          <th className="p-2 text-left">Price</th>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseHistory[product._id]?.map((purchase) => (
                          <tr key={purchase._id} className="border-t">
                            <td className="p-2">{purchase.supplier}</td>
                            <td className="p-2">{purchase.quantity}</td>
                            <td className="p-2">₹{purchase.price}</td>
                            <td className="p-2">{new Date(purchase.date).toLocaleDateString()}</td>
                            <td className="p-2">{purchase.remark || "-"}</td>
                            <td className="text-right">
  <button onClick={() => handleDeletePurchase(purchase._id, product._id, purchase.quantity)}>
    🗑️
  </button>
</td>

                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {addingFor === product._id ? (
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <input name="supplier" value={newPurchase.supplier} onChange={handleChange} placeholder="Supplier" className="border p-2 text-sm rounded" />
                        <input name="quantity" type="number" value={newPurchase.quantity} onChange={handleChange} placeholder="Qty" className="border p-2 text-sm rounded" />
                        <input name="price" type="number" value={newPurchase.price} onChange={handleChange} placeholder="Price" className="border p-2 text-sm rounded" />
                        <input name="date" type="date" value={newPurchase.date} onChange={handleChange} className="border p-2 text-sm rounded" />
                        <input name="remark" value={newPurchase.remark} onChange={handleChange} placeholder="Remark" className="border p-2 text-sm rounded" />
                        <div className="col-span-full flex gap-2 mt-2">
                          <button onClick={() => handleAddPurchase(product._id)} className="bg-green-600 text-white px-4 py-1 text-sm rounded">Save</button>
                          <button onClick={() => setAddingFor(null)} className="text-red-500 text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingFor(product._id)} className="text-sm text-blue-500 underline">+ Add Purchase</button>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table> */}
    </div>
  );
};

export default Inventory;
