import mongoose from 'mongoose';

const schemaOptions = {
  toJSON: {
    virtuals: true,
  },
  toObject: {
    vituals: true,
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

    mentionedParents: {
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

PostSchema.virtual('mentioningChildren', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'mentionedParents',
});

PostSchema.methods.toCustomJSON = async function () {
  const post = this;
  await post.populate('mainPostChildren');
  await post.populate('mentioningChildren');
  const postObject = await post.toObject({ virtuals: true });
  console.log(postObject);
  delete postObject.__v;
  return postObject;
};

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
    for (const parentId of post.mentionedParents) {
      const formerParent = await Post.findById(parentId);
      if (formerParent) {
        formerParent.mentioningChildren.splice(
          formerParent.mentioningChildren.indexOf(post._id),
          1
        );
        await formerParent.save();
      }
    }
    for (const childId of post.mentioningChildren) {
      const formerChild = await Post.findById(childId);
      if (formerChild) {
        formerChild.mentionedParents.splice(
          formerChild.mentionedParents.indexOf(post._id),
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
