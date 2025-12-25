'use client';
import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { TAG_CONFIG, TAG_CATEGORIES } from '../lib/constants';

const TagInput = ({ category, tags, setTags, displayTags, setDisplayTags }) => {
    const [inputValue, setInputValue] = useState('');
    const config = TAG_CATEGORIES[category];
    const maxTags = config.maxTags;
    const maxDisplayTags = config.displayTags;

    const handleKeyDown = (e) => {
        if ((e.key === ',' || e.key === 'Enter') && inputValue.trim() !== '') {
            e.preventDefault();
            const newTag = inputValue.trim().toLowerCase();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
        setDisplayTags(displayTags.filter(tag => tag !== tagToRemove));
    };

    const toggleDisplayTag = (tag) => {
        if (displayTags.includes(tag)) {
            setDisplayTags(displayTags.filter(t => t !== tag));
        } else if (displayTags.length < maxDisplayTags) {
            setDisplayTags([...displayTags, tag]);
        }
    };

    return (
        <div className={`border rounded-lg p-4 ${config.borderClass} bg-white`}>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h4 className={`font-semibold ${config.textClass}`}>{config.name}</h4>
                    <p className="text-xs text-gray-500">{config.description}</p>
                </div>
                <span className={`text-sm font-medium ${tags.length >= maxTags ? 'text-red-500' : 'text-gray-500'}`}>
                    {tags.length}/{maxTags}
                </span>
            </div>

            {/* Tag display area */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
                {tags.map((tag, index) => {
                    const isOverLimit = index >= maxTags;
                    const isDisplayTag = displayTags.includes(tag);

                    // If over limit, show in red and don't allow display selection
                    if (isOverLimit) {
                        return (
                            <div
                                key={tag}
                                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 border border-red-300"
                                title="This tag exceeds the limit and won't be saved"
                            >
                                <span>#{tag}</span>
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="text-red-600 hover:text-red-800 cursor-pointer"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={tag}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${config.bgClass} ${config.textClass} border ${isDisplayTag ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                        >
                            <button
                                type="button"
                                onClick={() => toggleDisplayTag(tag)}
                                className={`cursor-pointer ${isDisplayTag ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title={isDisplayTag ? 'Remove from card display' : 'Show on card'}
                            >
                                <Check className="h-3 w-3" />
                            </button>
                            <span>#{tag}</span>
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="text-gray-500 hover:text-gray-700 cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Input field */}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Add ${config.name.toLowerCase().replace(' tags', '')} tag...`}
                className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Display tag selection info */}
            <div className="mt-2 flex items-center text-xs text-gray-500">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>
                    Select {maxDisplayTags} tags to show on product card ({displayTags.length}/{maxDisplayTags} selected)
                </span>
            </div>
        </div>
    );
};

const TagManager = ({
    triggerTags,
    setTriggerTags,
    solutionTags,
    setSolutionTags,
    displayTriggerTags,
    setDisplayTriggerTags,
    displaySolutionTags,
    setDisplaySolutionTags
}) => {
    const totalTags = triggerTags.length + solutionTags.length;
    const totalDisplayTags = displayTriggerTags.length + displaySolutionTags.length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Product Tags
                </label>
                <span className={`text-sm ${totalTags >= TAG_CONFIG.TOTAL_MAX_TAGS ? 'text-red-500' : 'text-gray-500'}`}>
                    Total: {totalTags}/{TAG_CONFIG.TOTAL_MAX_TAGS}
                </span>
            </div>

            <p className="text-xs text-gray-500 -mt-2">
                Add up to {TAG_CONFIG.MAX_TRIGGER_TAGS} trigger event tags and {TAG_CONFIG.MAX_SOLUTION_TAGS} solution tags.
                Select {TAG_CONFIG.TOTAL_DISPLAY_TAGS} total to display on the product card.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TagInput
                    category="TRIGGER"
                    tags={triggerTags}
                    setTags={setTriggerTags}
                    displayTags={displayTriggerTags}
                    setDisplayTags={setDisplayTriggerTags}
                />
                <TagInput
                    category="SOLUTION"
                    tags={solutionTags}
                    setTags={setSolutionTags}
                    displayTags={displaySolutionTags}
                    setDisplayTags={setDisplaySolutionTags}
                />
            </div>

            {/* Validation message */}
            {totalDisplayTags !== TAG_CONFIG.TOTAL_DISPLAY_TAGS && (
                <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>
                        Please select exactly {TAG_CONFIG.DISPLAY_TRIGGER_TAGS} trigger tags and {TAG_CONFIG.DISPLAY_SOLUTION_TAGS} solution tags to display on the product card.
                    </span>
                </div>
            )}
        </div>
    );
};

export default TagManager;
