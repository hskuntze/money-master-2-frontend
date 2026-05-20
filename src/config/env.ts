export const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
export const APP_PUBLIC_URL = process.env.REACT_APP_PUBLIC_URL || window.location.origin;
