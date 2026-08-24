import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="p-8 text-center">
      <h1 className="text-4xl font-bold">404 - Not Found</h1>
      <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-4 inline-block text-blue-500 hover:underline">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
