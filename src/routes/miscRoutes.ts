import { getMedia, search, unmatchedRoute } from "@/controllers";
import express from "express";

export const miscRoutes = express.Router();
/// OTHER NEEDED ROUTES ///
// GET request for finding posts/user
miscRoutes.get("/search", search);

miscRoutes.get("/media/:mediatype/:mediafile", getMedia);

miscRoutes.all("*", unmatchedRoute);
