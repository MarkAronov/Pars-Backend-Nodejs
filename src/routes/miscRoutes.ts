import express from "express";
import { getMedia, search, unmatchedRoute } from "../controllers";

export const miscRoutes = express.Router();
/// OTHER NEEDED ROUTES ///
// GET request for finding posts/user
miscRoutes.get("/search", search);

miscRoutes.get("/media/:mediatype/:mediafile", getMedia);

miscRoutes.all("*", unmatchedRoute);
