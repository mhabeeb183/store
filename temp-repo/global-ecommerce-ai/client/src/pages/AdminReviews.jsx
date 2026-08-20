import axios from "axios";
import { useEffect, useState } from "react";
import Rating from "../components/Rating";

const AdminReviews = () => {
const [reviews, setReviews] = useState([]);

useEffect(() => {
const fetchReviews = async () => {
try {
const userInfo = JSON.parse(
localStorage.getItem("userInfo")
);


    const { data } = await axios.get(
      "http://localhost:5000/api/products/reviews/all",
      {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      }
    );

    setReviews(data);
  } catch (error) {
    console.log(error);
  }
};

fetchReviews();


}, []);

return ( <div className="p-8"> <h1 className="text-3xl font-bold mb-6">
All Product Reviews </h1>


  <div className="overflow-x-auto bg-white shadow rounded-xl">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-3 text-left">
            Product
          </th>

          <th className="p-3 text-left">
            User
          </th>

          <th className="p-3 text-left">
            Rating
          </th>

          <th className="p-3 text-left">
            Comment
          </th>

          <th className="p-3 text-left">
            Date
          </th>
        </tr>
      </thead>

      <tbody>
        {reviews.map((review) => (
          <tr
            key={review.reviewId}
            className="border-t"
          >
            <td className="p-3">
              {review.productName}
            </td>

            <td className="p-3">
              {review.name}
            </td>

            <td className="p-3">
              <Rating
                value={review.rating}
              />
            </td>

            <td className="p-3">
              {review.comment}
            </td>

            <td className="p-3">
              {new Date(
                review.createdAt
              ).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


);
};

export default AdminReviews;
