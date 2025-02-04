import { ErrorAO } from "../../utils/generalUtils";
import { POST_RULES } from "./post.constants";

export const validatePostContent = (value: string): void => {
    const errors = [];
    if (!value.trim()) errors.push("Content cannot be empty");
    if (value.length > POST_RULES.MAX_CONTENT_LENGTH) 
        errors.push(`Content cannot be longer than ${POST_RULES.MAX_CONTENT_LENGTH} characters`);
    if (errors.length) throw new ErrorAO(errors, "content");
};

export const validateAttachments = (files: Express.Multer.File[]): void => {
    const errors = [];
    if (files.length > POST_RULES.MAX_ATTACHMENTS)
        errors.push(`Maximum ${POST_RULES.MAX_ATTACHMENTS} attachments allowed`);
    
    for (const file of files) {
        if (!POST_RULES.ALLOWED_ATTACHMENT_TYPES.includes(file.mimetype))
            errors.push(`File type ${file.mimetype} not allowed`);
        if (file.size > POST_RULES.MAX_ATTACHMENT_SIZE)
            errors.push(`File ${file.originalname} exceeds maximum size of ${POST_RULES.MAX_ATTACHMENT_SIZE / 1024 / 1024}MB`);
    }

    if (errors.length) throw new ErrorAO(errors, "attachments");
};
