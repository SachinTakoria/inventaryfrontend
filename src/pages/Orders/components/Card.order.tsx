import { ConfirmDialog } from "primereact/confirmdialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegTrashAlt,FaEdit  } from "react-icons/fa";
import { toast } from "sonner";
import { Button } from "primereact/button";
import { BsPrinter } from "react-icons/bs";
import { useDeleteOrderMutation } from "../../../provider/queries/Orders.query";
import ShowAndPrintModel from "./ShowAndPrint.model";



const TableCard = ({ data, id }: any) => {
  const navigate = useNavigate(); // ✅ FIXED: Move inside component

  const [DeleteConsumer, DeleteConsumerResponse] = useDeleteOrderMutation();
  const [visible, setVisible] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const deleteHandler = async (_id: string) => {
    try {
      const { data, error }: any = await DeleteConsumer(_id);

      if (error) {
        toast.error(error.data.message);
        return;
      }

      toast.success(data.message || "Order Deleted Successfully");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <tr className="bg-white border-b">
        <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
          {id}
        </th>
        <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
          {data?.consumer?.name}
        </th>
        <td className="px-6 py-4">{data?.consumer?.email}</td>
        <td className="px-6 py-4">
          <ul>
            {data.items.slice(0, 2).map((cur: any, i: number) => (
              <li key={i}>
                {cur?.name} - {cur?.quantity} pcs × ₹{cur?.price} =
                <b> ₹{cur?.quantity * cur?.price}/-</b>
              </li>
            ))}
          </ul>

          {data.items.length > 2 && (
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-blue-500 underline text-sm mt-2"
            >
              {showMore ? "View Less" : "View More"}
            </button>
          )}

          {showMore && (
            <ul>
              {data.items.slice(2).map((cur: any, i: number) => (
                <li key={i}>
                  {cur?.name} - {cur?.quantity} pcs × ₹{cur?.price} =
                  <b> ₹{cur?.quantity * cur?.price}/-</b>
                </li>
              ))}
            </ul>
          )}
        </td>

        <td className="px-6 py-4">
        <button
  onClick={() => navigate("/orders/add", { state: data })}
  title="Edit"
  className="p-4 bg-yellow-500 text-white rounded-sm mx-2"
>
  <FaEdit className="text-xl" />
</button>

          <button
            onClick={() => setVisible(!visible)}
            title="View"
            className="p-4 bg-teal-500 text-white rounded-sm mx-2"
          >
            <BsPrinter className="text-xl" />
          </button>

          <Button
            loading={DeleteConsumerResponse.isLoading}
            onClick={() => deleteHandler(data._id)}
            title="Delete"
            className="p-4 bg-red-500 text-white rounded-sm mx-2"
          >
            <FaRegTrashAlt className="text-xl" />
          </Button>
        </td>
      </tr>

      <ShowAndPrintModel
        id={data._id}
        visible={visible}
        setVisible={setVisible}
      />

      <ConfirmDialog
        id="order.queries"
        acceptClassName=""
        className=" "
        contentClassName="py-2 "
        closable
      />
    </>
  );
};

export default TableCard;
