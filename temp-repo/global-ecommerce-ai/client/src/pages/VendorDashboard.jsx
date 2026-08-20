import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const VendorDashboard = () => {
  const { userInfo } = useSelector(
    (state) => state.auth
  );

  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] =
  useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
const [editWarehouseLocation, setEditWarehouseLocation] =
  useState("");
const [editLowStockThreshold, setEditLowStockThreshold] =
  useState(10);
const [editArModelUrl, setEditArModelUrl] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [arModelUrl, setArModelUrl] = useState("");
  const [modelFile, setModelFile] = useState(null);
  const [editModelFile, setEditModelFile] = useState(null);
  const [uploading, setUploading] = useState(false);


  useEffect(() => {
    if (userInfo && userInfo.token) {
      fetchProducts();
    }
  }, [userInfo]);

  const fetchProducts = async () => {
    if (!userInfo || !userInfo.token) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get(
        "http://localhost:5000/api/products/vendor/my-products",
        config
      );

      setProducts(data);

      setLowStockProducts(
        data.filter(
          (product) =>
            product.stock <=
            product.lowStockThreshold
        )
      );

    } catch (error) {
      console.log(error);
    }
  };


  const uploadImageHandler = async (file) => {
  try {
    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    const { data } = await axios.post(
      "http://localhost:5000/api/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setUploading(false);

    return data.imageUrl;
  } catch (error) {
    console.log(error);

    setUploading(false);

    alert("Image Upload Failed");

    return null;
  }
};

  const uploadModelHandler = async (file) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("model", file);
      const { data } = await axios.post(
        "http://localhost:5000/api/upload/model",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setUploading(false);
      return data.modelUrl;
    } catch (error) {
      console.log(error);
      setUploading(false);
      alert("Model Upload Failed");
      return null;
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImageHandler(image);
        if (!imageUrl) {
          return; // Upload failed
        }
      }

      let finalModelUrl = arModelUrl;
      if (modelFile) {
        const uploadedModel = await uploadModelHandler(modelFile);
        if (uploadedModel) finalModelUrl = uploadedModel;
      }

      await axios.post(
        "http://localhost:5000/api/products",
        {
          name,
          brand,
          description,
          category,
          stock,
          price,
          images: imageUrl ? [imageUrl] : [],
          arModelUrl: finalModelUrl,
        },
        config
      );

      alert("Product Added Successfully");

      setName("");
      setBrand("");
      setDescription("");
      setCategory("");
      setStock("");
      setPrice("");
      setImage(null);
      setArModelUrl("");
      setModelFile(null);
      setEditStock("");
      setEditWarehouseLocation("");
      setEditLowStockThreshold(10);

      fetchProducts();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Failed to add product"
      );
    }
  };

  const deleteProduct = async (id) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.delete(
        `http://localhost:5000/api/products/${id}`,
        config
      );

      alert("Product Deleted");

      fetchProducts();
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Delete Failed"
      );
    }
  };

  

  const updateProduct = async () => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    let finalEditModelUrl = editArModelUrl;
    if (editModelFile) {
      const uploadedModel = await uploadModelHandler(editModelFile);
      if (uploadedModel) finalEditModelUrl = uploadedModel;
    }

    await axios.put(
      `http://localhost:5000/api/products/${editingId}`,
      {
        name: editName,
        price: editPrice,
         stock: editStock,
          warehouseLocation:
            editWarehouseLocation,
          lowStockThreshold:
            editLowStockThreshold,
          arModelUrl: finalEditModelUrl,
      },
      config
    );

    alert("Product Updated Successfully");

    setEditingId(null);
    setEditName("");
    setEditPrice("");
    setEditStock("");
    setEditWarehouseLocation("");
    setEditLowStockThreshold(10);
    setEditArModelUrl("");
    setEditModelFile(null);

    fetchProducts();
  } catch (error) {
    console.log(error);

    alert(
      error.response?.data?.message ||
      "Update Failed"
    );
  }
};


  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-6 text-gray-800">
        Vendor Dashboard
      </h1>
            {lowStockProducts.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded-lg mb-6">
          <h2 className="font-bold text-lg mb-2">
            ⚠ Low Stock Alerts
          </h2>

          {lowStockProducts.map(
            (product) => (
              <p key={product._id}>
                {product.name} —
                Only {product.stock} left
              </p>
            )
          )}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <Link
    to="/vendor/reviews"
    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
  >
    Product Reviews
  </Link>
</div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">
          Add Product
        </h2>

        <form
          onSubmit={submitHandler}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Product Name"
            className="w-full border p-3 rounded"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          <input
            type="text"
            placeholder="Brand"
            className="w-full border p-3 rounded"
            value={brand}
            onChange={(e) =>
              setBrand(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Description"
            className="w-full border p-3 rounded"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            required
          />

          <input
            type="text"
            placeholder="Category"
            className="w-full border p-3 rounded"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            required
          />

          <input
            type="number"
            placeholder="Stock"
            className="w-full border p-3 rounded"
            value={stock}
            onChange={(e) =>
              setStock(e.target.value)
            }
            required
          />

          <input
            type="number"
            placeholder="Price"
            className="w-full border p-3 rounded"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            required
          />

          <input
            type="file"
            className="w-full border p-3 rounded"
            onChange={(e) =>
             setImage(e.target.files[0])
            }
          />
          
          <input
            type="file"
            accept=".glb,.gltf"
            className="w-full border p-3 rounded"
            onChange={(e) =>
             setModelFile(e.target.files[0])
            }
          />
          <p className="text-xs text-gray-500 -mt-2 ml-2">Upload a 3D Model (.glb) or paste a URL below</p>

          <input
            type="text"
            placeholder="AR Model URL (.glb format) [Optional]"
            className="w-full border p-3 rounded"
            value={arModelUrl}
            onChange={(e) =>
              setArModelUrl(e.target.value)
            }
          />

        {uploading && (
        <p className="text-blue-600">
         Uploading Image...
         </p>
        )}

          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
          >
            Add Product
          </button>
        </form>
      </div>

     <div className="mt-10">
  <h2 className="text-2xl font-bold mb-4">
    My Products
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {products.map((product) => (
      <div
        key={product._id}
        className="bg-white p-4 rounded-lg shadow"
      >
        <img
          src={
            product.images?.[0] ||
            "https://via.placeholder.com/300"
          }
          alt={product.name}
          className="h-48 w-full object-cover rounded"
        />

        <h3 className="text-xl font-bold mt-3">
          {product.name}
        </h3>

        <p className="text-gray-600">
          {product.brand}
        </p>

        <p className="text-blue-600 font-bold text-lg">
          ₹ {product.price}
        </p>
        <div className="mt-2 space-y-1">
  <p>
    <strong>Stock:</strong>{" "}
    {product.stock}
  </p>

  <p>
    <strong>Sold:</strong>{" "}
    {product.soldCount || 0}
  </p>

  <p>
    <strong>Warehouse:</strong>{" "}
    {product.warehouseLocation ||
      "Main Warehouse"}
  </p>

  <p>
    <strong>Low Stock Alert:</strong>{" "}
    {product.lowStockThreshold}
  </p>

  <div>
    <strong>Status:</strong>{" "}
        {product.stock === 0 ? (
      <div className="flex items-center gap-3">
        <span className="text-red-600 font-bold">
          🔴 Out Of Stock
        </span>

        <button
          onClick={() => {
            setEditingId(product._id);

            setEditName(product.name);
            setEditPrice(product.price);

            setEditStock(50);

            setEditWarehouseLocation(
              product.warehouseLocation ||
                "Main Warehouse"
            );

            setEditLowStockThreshold(
              product.lowStockThreshold || 10
            );
            
            setEditArModelUrl(product.arModelUrl || "");
          }}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Restock
        </button>
      </div>
    ) : product.stock <=
      product.lowStockThreshold ? (
      <span className="text-yellow-600 font-bold">
        Low Stock
      </span>
    ) : (
      <span className="text-green-600 font-bold">
        Healthy Stock
      </span>
    )}
  </div>
</div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setEditingId(product._id);
              setEditName(product.name);
              setEditPrice(product.price);
                setEditStock(product.stock || 0);

                setEditWarehouseLocation(
                  product.warehouseLocation ||
                    "Main Warehouse"
                );

                setEditLowStockThreshold(
                  product.lowStockThreshold || 10
                );
                
                setEditArModelUrl(product.arModelUrl || "");
            }}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Edit
          </button>

          <button
            onClick={() =>
              deleteProduct(product._id)
            }
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>

             {editingId === product._id && (
  <div className="mt-4 space-y-2">
    <input
      type="text"
      value={editName}
      onChange={(e) =>
        setEditName(e.target.value)
      }
      placeholder="Product Name"
      className="w-full border p-2 rounded"
    />

    <input
      type="number"
      value={editPrice}
      onChange={(e) =>
        setEditPrice(e.target.value)
      }
      placeholder="Price"
      className="w-full border p-2 rounded"
    />

    <input
      type="number"
      value={editStock}
      onChange={(e) =>
        setEditStock(e.target.value)
      }
      placeholder="Stock Quantity"
      className="w-full border p-2 rounded"
    />

    <input
      type="text"
      value={editWarehouseLocation}
      onChange={(e) =>
        setEditWarehouseLocation(
          e.target.value
        )
      }
      placeholder="Warehouse Location"
      className="w-full border p-2 rounded"
    />

    <input
      type="number"
      value={editLowStockThreshold}
      onChange={(e) =>
        setEditLowStockThreshold(
          e.target.value
        )
      }
      placeholder="Low Stock Threshold"
      className="w-full border p-2 rounded"
    />

    <input
      type="file"
      accept=".glb,.gltf"
      className="w-full border p-2 rounded"
      onChange={(e) =>
        setEditModelFile(e.target.files[0])
      }
    />

    <input
      type="text"
      value={editArModelUrl}
      onChange={(e) =>
        setEditArModelUrl(e.target.value)
      }
      placeholder="AR Model URL (.glb)"
      className="w-full border p-2 rounded"
    />

    <button
      onClick={updateProduct}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      Save Changes
    </button>
  </div>
)}
      </div>
    ))}
  </div>
</div>
</div>
);
};

export default VendorDashboard;