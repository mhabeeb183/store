
import axios from "axios";

const API_URL =
  "http://localhost:5000/api/subscriptions";

export const purchaseSubscription = async (
  planId,
  token,
  useWallet = true
) => {
  const { data } = await axios.post(
    `${API_URL}/purchase`,
    {
      planId,
      useWallet,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
};

