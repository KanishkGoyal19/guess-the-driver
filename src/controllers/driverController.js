import {
  randomDriverService,
  driverNameService,
  allDriverService,
} from "../model/driverModel.js";

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({
    status,
    message,
    data,
  });
};

export const getRandomDriver = async (req, res, next) => {
  try {
    const driver = await randomDriverService();

    if (!driver) {
      return handleResponse(res, 404, "No driver found for today");
    }

    handleResponse(res, 200, "Today’s driver retrieved successfully", driver);
  } catch (error) {
    next(error);
  }
};

export const getDriverNames = async (req, res, next) => {
  try {
    const names = await driverNameService();
    handleResponse(res, 200, "Driver names retrieved successfully", names);
  } catch (error) {
    next(error);
  }
};

export const getAllDrivers = async (req, res, next) => {
  try {
    const searchName = req.query.name || "";
    const drivers = await allDriverService(searchName);
    handleResponse(res, 200, "Drivers retrieved successfully", drivers);
  } catch (error) {
    next(error);
  }
};