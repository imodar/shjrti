import React from 'react';

const VisualEditsTest = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center space-y-8">
          {/* Simple Heading */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Visual Edits Test Section
          </h1>
          
          {/* Simple Paragraph */}
          <p className="text-lg text-gray-600 dark:text-gray-300">
            This is a simple test section to verify Visual Edits functionality. 
            You should be able to select and edit this text directly.
          </p>
          
          {/* Simple Button */}
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors">
            Test Button
          </button>
          
          {/* Simple Image Container */}
          <div className="bg-gray-200 dark:bg-gray-700 p-8 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Image Placeholder
            </h3>
            <div className="bg-gray-300 dark:bg-gray-600 h-40 rounded flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">
                Image goes here
              </span>
            </div>
          </div>
          
          {/* Simple List */}
          <div className="text-left bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Simple List
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>First item</li>
              <li>Second item</li>
              <li>Third item</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisualEditsTest;