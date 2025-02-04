import { ErrorAO } from "../../utils/generalUtils";
import { TOPIC_RULES } from "./topic.constants";

export const validateTopicName = (value: string): void => {
    const errors = [];
    if (!value.trim()) errors.push("Topic name cannot be empty");
    if (value.length > TOPIC_RULES.MAX_NAME_LENGTH)
        errors.push(`Topic name cannot be longer than ${TOPIC_RULES.MAX_NAME_LENGTH} characters`);
    if (errors.length) throw new ErrorAO(errors, "name");
};

export const validateTopicDescription = (value: string | undefined): void => {
    if (!value) return;
    if (value.length > TOPIC_RULES.MAX_DESCRIPTION_LENGTH)
        throw new ErrorAO([
            `Description cannot be longer than ${TOPIC_RULES.MAX_DESCRIPTION_LENGTH} characters`
        ], "description");
};

export const validateTopicMedia = (file: Express.Multer.File, type: 'icon' | 'banner'): void => {
    const errors = [];
    if (!TOPIC_RULES.ALLOWED_IMAGE_TYPES.includes(file.mimetype))
        errors.push(`File type ${file.mimetype} not allowed`);

    const maxSize = type === 'icon' ? TOPIC_RULES.MAX_ICON_SIZE : TOPIC_RULES.MAX_BANNER_SIZE;
    if (file.size > maxSize)
        errors.push(`File exceeds maximum size of ${maxSize / 1024 / 1024}MB`);

    if (errors.length) throw new ErrorAO(errors, type);
};
