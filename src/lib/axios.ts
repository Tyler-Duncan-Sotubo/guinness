import Axios, { isAxiosError } from "axios";

export const axiosInstance = Axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Optional: handle 401s globally
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export { isAxiosError, axiosInstance as api };
