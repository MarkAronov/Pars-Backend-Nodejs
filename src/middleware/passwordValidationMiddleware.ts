import type { Request } from "@/types";
import { wrap } from "@/utils";
import bcrypt from "bcryptjs";
import type { NextFunction, Response } from "express";

export const validatePassword = () => wrap(
	async (req: Request, res: Response, next: NextFunction) => {
		const currentUser = req.user;
		const newPassword = req.body.newPassword;

		if (currentUser && newPassword) {
			const formerPasses = currentUser.formerPasswords;
			if (formerPasses) {
				for (const formerPass of formerPasses as string[]) {
					if (await bcrypt.compare(newPassword, formerPass)) {
						req.errorList = req.errorList || {};
						req.errorList.password = [
							"This password was previously used, use another.",
						];
					}
				}
			}
		}

		next();
	},
);
