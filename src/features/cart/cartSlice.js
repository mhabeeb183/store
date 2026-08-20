import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
};

// Async thunks for syncing with backend API
export const fetchCart = createAsyncThunk("cart/fetchCart", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];
    
    const res = await fetch("/api/cart", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      throw new Error("Failed to fetch cart");
    }
    return res.json();
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const addToCartAsync = createAsyncThunk("cart/addToCartAsync", async (product, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add items to your cart!");
      return rejectWithValue("Unauthorized");
    }

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Your session has expired. Please log in again.");
        window.location.href = "/login";
      }
      throw new Error("Failed to add to cart");
    }
    return res.json();
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateQuantityAsync = createAsyncThunk(
  "cart/updateQuantityAsync",
  async ({ id, change }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/cart/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ change }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      return res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeFromCartAsync = createAsyncThunk(
  "cart/removeFromCartAsync",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/cart/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to remove from cart");
      return res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart(state) {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(updateQuantityAsync.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload) ? action.payload : [];
      });
  },
});

export const { clearCart } = cartSlice.actions;

export default cartSlice.reducer;
