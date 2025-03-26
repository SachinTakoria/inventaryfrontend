import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AddOrderModel from "./AddOrder.model";

const AddOrderPage = () => {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  // ⛔ Jab modal band ho jaaye, redirect kar do
  useEffect(() => {
    if (!visible) {
      navigate("/orders");
    }
  }, [visible, navigate]);

  return (
    <div className="p-4">
      <AddOrderModel visible={visible} setVisible={setVisible} />
    </div>
  );
};

export default AddOrderPage;
