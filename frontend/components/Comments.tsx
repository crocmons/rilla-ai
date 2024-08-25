import React from "react";

// Define the Comment interface
interface Comment {
  text: string;
  commentID: string;
  transcriptSegmentID: string;
  userID: string;
  timestamp: string;
  fileLinks: string[]; // URLs of uploaded files
}

// Define the props for the Comments component
interface CommentsProps {
  comments: Comment[];
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
}

const Comments: React.FC<CommentsProps> = ({ comments, onEdit, onDelete }) => {
  const handleEdit = async (comment: Comment) => {
    try {
      const response = await fetch(`https://riz3ap1tx8.execute-api.ap-south-1.amazonaws.com/comments/${comment.commentID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(comment),
      });

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      const updatedComment = await response.json();
      onEdit(updatedComment);
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(`https://riz3ap1tx8.execute-api.ap-south-1.amazonaws.com/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      onDelete(commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <div className="comments">
      {comments.length > 0 ? (
        comments.map((comment) => (
          <div key={comment.commentID} className="comment">
            <p>{comment.text}</p>
            <button onClick={() => handleEdit(comment)}>Edit</button>
            <button onClick={() => handleDelete(comment.commentID)}>Delete</button>
          </div>
        ))
      ) : (
        <p>Add a comment</p>
      )}
    </div>
  );
};

export default Comments;
