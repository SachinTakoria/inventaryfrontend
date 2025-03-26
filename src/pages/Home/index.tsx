import { useEffect, useState } from "react";
import axios from "axios";
import BasicChart from "./components/Basic";
import PieChartDemo from "./components/Pie";

const HomePage = () => {
  const [stats, setStats] = useState({
    todaySale: 0,
    yesterdaySale: 0,
    totalUsers: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/orders/sales-stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setStats(data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-4 w-full space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Today's Sale" value={`₹${stats.todaySale}`} />
        <Card title="Yesterday's Sale" value={`₹${stats.yesterdaySale}`} />
        <Card title="Total Users" value={stats.totalUsers} />
        <Card title="Total Orders" value={stats.totalOrders} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicChart />
        <PieChartDemo />
      </div>
    </div>
  );
};

const Card = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white shadow-md rounded-xl p-6">
    <p className="text-gray-500 font-semibold">{title}</p>
    <h2 className="text-2xl font-bold text-indigo-600 mt-2">{value}</h2>
  </div>
);

export default HomePage;
