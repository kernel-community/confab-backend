import { ErrorBuilder } from "../../interfaces";

export const errorBuilder: ErrorBuilder = (message, status, logData) => ({
  message,
  status,
  logData,
});
