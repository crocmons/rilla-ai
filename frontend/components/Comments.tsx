import React, { useState } from "react";

interface Comment {
  text: string;
  commentID: string;
  transcriptSegmentID: string;
  userID: string;
  timestamp: string;
  fileLinks: string[];
}

interface CommentsProps {
  comments: Comment[];
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onAdd: (comment: Comment) => void;
}

const Comments: React.FC<CommentsProps> = ({ comments, onEdit, onDelete, onAdd }) => {
  const [newCommentText, setNewCommentText] = useState<string>("");

  const handleAddComment = async () => {
    const newComment: Comment = {
      text: newCommentText,
      commentID: `${Date.now()}`, // Unique ID based on timestamp
      transcriptSegmentID: "segment1", // Placeholder for transcript segment ID
      userID: "user1", // Placeholder for user ID
      timestamp: new Date().toISOString(),
      fileLinks: [], // Placeholder for file links
    };

    try {
      const response = await fetch(`https://riz3ap1tx8.execute-api.ap-south-1.amazonaws.com/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newComment),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const savedComment = await response.json();
      onAdd(savedComment);
      setNewCommentText(""); // Clear the input field
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="comments">
      <div className="add-comment">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="border rounded p-2"
        />
        <button onClick={handleAddComment} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded">
          Add Comment
        </button>
      </div>

      {comments.length > 0 ? (
        comments.map((comment) => (
          <div key={comment.commentID} className="comment mt-4 p-4 border rounded">
            <p>{comment.text}</p>
            <button
              onClick={() => onEdit(comment)}
              className="mr-2 bg-yellow-500 text-white px-2 py-1 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(comment.commentID)}
              className="bg-red-500 text-white px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))
      ) : (
        <p className="mt-4">No comments yet. Be the first to add one!</p>
      )}
    </div>
  );
};

export default Comments;
