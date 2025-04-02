import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { SidebarSlicePath, toggleSidebar } from '../provider/slice/Sidebar.slice';
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { FaFileInvoice } from "react-icons/fa"; 

import { RiBillLine } from "react-icons/ri";
import { BiSolidPurchaseTag } from "react-icons/bi";

import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";
import { AiOutlinePlus } from "react-icons/ai"; // Add Product Icon
import { Link } from 'react-router-dom';
import { MdProductionQuantityLimits } from "react-icons/md";

const MainLayout = ({ children }:{children:React.ReactNode}) => {
    const selector = useSelector(SidebarSlicePath); 
    const dispatch = useDispatch();

    return (
        <>
            <div className="flex items-start lg:gap-x-2">
                <Sidebar collapsed={selector.collapsed} breakPoint="lg" toggled={selector.toggle}>
                <Menu>
  <MenuItem className="lg:hidden" onClick={() => dispatch(toggleSidebar())}>
    {selector.toggle ? <IoIosArrowDropright className="text-2xl" /> : <IoIosArrowDropleft className="text-2xl" />} 
  </MenuItem>

  <MenuItem component={<Link to="/" />} icon={<MdOutlineSpaceDashboard className="text-2xl" />}> Dashboard </MenuItem>
  {/* <MenuItem component={<Link to="/user" />} icon={<FiUser className="text-2xl" />}> Users </MenuItem> */}
  <MenuItem component={<Link to="/purchase-items" />} icon={<BiSolidPurchaseTag  className="text-2xl" />}> Inventary </MenuItem>

  <MenuItem component={<Link to="/Add-product" />} icon={<AiOutlinePlus className="text-2xl" />}> Add Product </MenuItem>
  <MenuItem component={<Link to="/my-product" />} icon={<MdProductionQuantityLimits className="text-2xl" />}> My Products </MenuItem>

  {/* ✅ Dev Jyoti */}
  <MenuItem component={<Link to="/invoice-builder" />} icon={<FaFileInvoice className="text-2xl" />}> DJInvoice </MenuItem>
  <MenuItem component={<Link to="/my-bills" />} icon={<RiBillLine className="text-2xl" />}> DJBills </MenuItem>

  {/* ✅ Shree Sai Suit */}
  <MenuItem component={<Link to="/invoice-builder-2" />} icon={<FaFileInvoice className="text-2xl" />}> SSInvoice </MenuItem>
  <MenuItem component={<Link to="/shreesai-bills" />} icon={<RiBillLine className="text-2xl" />}> SSBills</MenuItem>
</Menu>

                </Sidebar>
                <div className="w-full">
                    {children}
                </div>
            </div>
        </>
    );
};

export default MainLayout;
