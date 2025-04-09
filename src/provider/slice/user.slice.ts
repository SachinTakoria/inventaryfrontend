import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null
};

export const UserSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload; // ✅ fixed
    },
    removeUser: (state) => {
      state.currentUser = null; // ✅ fixed
    },
  },
});

export const { setUser, removeUser } = UserSlice.actions;
export default UserSlice.reducer;
