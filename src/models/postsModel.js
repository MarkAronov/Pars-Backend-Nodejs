import mongoose from 'mongoose';

const schemaOptions = {
  toJSON: {
    virtuals: true,
  },
  timestamps: true,
  id: false,
};

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 254,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mainPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    // mainPostChildren: {
    //   type: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Post'
    //   }]
    // },
    replyingParents: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
      ],
    },
    replyingChildren: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
      ],
    },
    media: {
      type: [
        {
          type: Buffer,
        },
      ],
    },
    edited: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  schemaOptions
);

PostSchema.virtual('mainPostChildren', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'mainPost',
});

PostSchema.pre('remove', async function (next) {
  const post = this;
  if (post.mainPost === null) {
    await post.populate('mainPostChildren');
    for (const childId of post.mainPostChildren) {
      const childPost = await Post.findById(childId);
      if (childPost) {
        childPost.remove();
      }
    }
  } else {
    // post.mainPost.mainPostChildren.splice(post.mainPost.mainPostChildren.indexOf(post._id), 1)
    // await post.mainPost.save()
    for (const parentId of post.replyingParents) {
      const formerParent = await Post.findById(parentId);
      if (formerParent) {
        formerParent.replyingChildren.splice(
          formerParent.replyingChildren.indexOf(post._id),
          1
        );
        await formerParent.save();
      }
    }
    for (const childId of post.replyingChildren) {
      const formerChild = await Post.findById(childId);
      if (formerChild) {
        formerChild.replyingParents.splice(
          formerChild.replyingParents.indexOf(post._id),
          1
        );
        await formerChild.save();
      }
    }
  }
  next();
});

// Export model
const Post = mongoose.model('Post', PostSchema);
export default Post;
