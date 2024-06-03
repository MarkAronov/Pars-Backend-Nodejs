import { HydratedDocument } from 'mongoose';
import { IThread, IThreadVirtuals } from 'src/models/threadModel';

// Thread Related Types
export type ThreadType = HydratedDocument<IThread, IThreadVirtuals>;
