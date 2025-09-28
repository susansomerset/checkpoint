import React, { useState, useEffect } from 'react';
import { getPreferredNames, setPreferredName, getUniqueStudentNames, PreferredNames } from '../utils/preferredNames';
import { getCoursePreferences, setCoursePreference, getUniqueCourses, CoursePreferences } from '../utils/coursePreferences';
import { ProcessedAssignment } from '../types/canvas';
import { User, BookOpen, Save, X, Settings } from 'lucide-react';

interface SettingsManagerProps {
  assignments: ProcessedAssignment[];
  onNamesUpdated: () => void;
  coursePreferences: { [courseId: number]: { shortName: string; teacherName: string; period: number } };
  onCoursePreferencesUpdated: () => void;
}

export function SettingsManager({ assignments, onNamesUpdated, coursePreferences, onCoursePreferencesUpdated }: SettingsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'courses'>('students');
  const [preferredNames, setPreferredNamesState] = useState<PreferredNames>({});
  const [coursePreferencesState, setCoursePreferencesState] = useState<CoursePreferences>({});
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempShortName, setTempShortName] = useState('');
  const [tempTeacherName, setTempTeacherName] = useState('');
  const [tempPeriod, setTempPeriod] = useState<number>(1);

  const studentNames = getUniqueStudentNames(assignments);
  const courses = getUniqueCourses(assignments);

  useEffect(() => {
    const loadData = async () => {
      try {
        const preferredNames = await getPreferredNames();
        setPreferredNamesState(preferredNames);
      } catch (error) {
        console.error('Error loading preferred names:', error);
      }
    };
    loadData();
  }, []);

  // Update course preferences when they change from parent
  useEffect(() => {
    console.log('SettingsManager received course preferences:', coursePreferences);
    console.log('Course 23758 in SettingsManager:', coursePreferences[23758]);
    setCoursePreferencesState(coursePreferences);
  }, [coursePreferences]);

  const handleEditStudent = (legalName: string, currentPreferred: string) => {
    setEditingName(legalName);
    setTempValue(currentPreferred);
  };

  const handleSaveStudent = async (legalName: string) => {
    try {
      await setPreferredName(legalName, tempValue);
      const updatedNames = await getPreferredNames();
      setPreferredNamesState(updatedNames);
      setEditingName(null);
      setTempValue('');
      onNamesUpdated();
    } catch (error) {
      console.error('Error saving student name:', error);
      // Still update UI to reflect the change
      setEditingName(null);
      setTempValue('');
      onNamesUpdated();
    }
  };

  const handleCancelStudent = () => {
    setEditingName(null);
    setTempValue('');
  };

  const handleEditCourse = (courseId: number, currentShortName: string, currentTeacherName: string, currentPeriod: number) => {
    console.log('Editing course', courseId, 'current values:', { currentShortName, currentTeacherName, currentPeriod });
    console.log('Current coursePreferencesState:', coursePreferencesState);
    setEditingCourse(courseId);
    setTempShortName(currentShortName);
    setTempTeacherName(currentTeacherName);
    setTempPeriod(currentPeriod);
  };

  const handleSaveCourse = async (courseId: number) => {
    try {
      console.log('Saving course preference:', { courseId, tempShortName, tempTeacherName, tempPeriod });
      await setCoursePreference(courseId, tempShortName, tempTeacherName, tempPeriod);
      console.log('Course preference saved successfully');
      setEditingCourse(null);
      setTempShortName('');
      setTempTeacherName('');
      setTempPeriod(1);
      onCoursePreferencesUpdated();
    } catch (error) {
      console.error('Error saving course preference:', error);
      // Still update UI to reflect the change
      setEditingCourse(null);
      setTempShortName('');
      setTempTeacherName('');
      setTempPeriod(1);
      onCoursePreferencesUpdated();
    }
  };

  const handleCancelCourse = () => {
    setEditingCourse(null);
    setTempShortName('');
    setTempTeacherName('');
    setTempPeriod(1);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Settings</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-2 px-1 text-sm font-medium ${
            activeTab === 'students'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Edit Students</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-2 px-1 text-sm font-medium ${
            activeTab === 'courses'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Edit Courses</span>
          </div>
        </button>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 mb-3">
            Set preferred names for students that will be displayed throughout the application.
          </div>
          {studentNames.map(legalName => {
            const currentPreferred = preferredNames[legalName] || legalName;
            const isEditing = editingName === legalName;
            
            return (
              <div key={legalName} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">{legalName}</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter preferred name"
                      autoFocus
                    />
                  ) : (
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {currentPreferred}
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveStudent(legalName)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelStudent}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditStudent(legalName, currentPreferred)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 mb-3">
            Set short names for courses to save space in columns, override teacher names, and set period numbers for proper sequencing.
          </div>
          {courses.map(course => {
            const preference = coursePreferencesState[course.courseId];
            const currentShortName = preference?.shortName || course.courseName;
            const currentTeacherName = preference?.teacherName || course.teacherName;
            const currentPeriod = preference?.period || 1;
            const isEditing = editingCourse === course.courseId;
            
            return (
              <div key={course.courseId} className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-2">{course.courseName}</div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Short Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempShortName}
                        onChange={(e) => setTempShortName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter short name"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{currentShortName}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Teacher Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempTeacherName}
                        onChange={(e) => setTempTeacherName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter teacher name"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{currentTeacherName}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={tempPeriod}
                        onChange={(e) => setTempPeriod(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Period number"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{currentPeriod}</div>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 flex justify-end">
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveCourse(course.courseId)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelCourse}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditCourse(course.courseId, currentShortName, currentTeacherName, currentPeriod)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        All preferences are saved locally in your browser and will be remembered when you refresh the page.
      </div>
      </div>
    </div>
  );
}
