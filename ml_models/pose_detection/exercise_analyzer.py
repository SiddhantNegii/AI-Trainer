"""
Exercise Form Analyzer
Analyzes specific exercises and provides real-time feedback
"""

import numpy as np
import mediapipe as mp
try:
    from pose_detector import PoseDetector
except ImportError:
    from .pose_detector import PoseDetector


class ExerciseAnalyzer:
    """
    Analyzes different exercise types and provides form correction feedback
    """
    
    def __init__(self):
        """
        Initialize exercise templates and thresholds
        """
        self.pose_detector = PoseDetector()
        self.mp_pose = mp.solutions.pose
        
        # Rep counting state
        self.rep_count = 0
        self.stage = None  # "up" or "down"
        
        # Exercise thresholds
        self.thresholds = {
            'squat': {
                'knee_angle_down': 90,
                'knee_angle_up': 160,
                'back_angle_min': 160,
                'back_angle_max': 200
            },
            'pushup': {
                'elbow_angle_down': 90,
                'elbow_angle_up': 160,
                'body_angle_min': 160,
                'body_angle_max': 200
            },
            'plank': {
                'body_angle_min': 165,
                'body_angle_max': 195,
                'min_hold_time': 5  # seconds
            },
            'lunge': {
                'knee_angle_down': 95,
                'knee_angle_up': 160,
                'back_angle_min': 160,
                'back_angle_max': 200
            },
            'bicep_curl': {
                'elbow_flexed': 50,
                'elbow_extended': 160,
                'elbow_drift_max': 0.08
            },
            'shoulder_press': {
                'elbow_down': 95,
                'elbow_up': 160,
                'wrist_stack_max': 0.1
            }
        }
    
    def analyze_squat(self, landmarks):
        """
        Analyze squat form
        
        Args:
            landmarks: MediaPipe pose landmarks
            
        Returns:
            dict: {
                'feedback': List of correction messages,
                'score': Form accuracy score (0-100),
                'angles': Dict of joint angles,
                'stage': Current movement stage
            }
        """
        if not landmarks:
            return {'feedback': ['No pose detected'], 'score': 0, 'angles': {}, 'stage': None}
        
        # Get joint coordinates
        hip = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_HIP.value)
        knee = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_KNEE.value)
        ankle = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_ANKLE.value)
        shoulder = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_SHOULDER.value)
        
        # Calculate angles
        knee_angle = self.pose_detector.calculate_angle(hip, knee, ankle)
        back_angle = self.pose_detector.calculate_angle(shoulder, hip, knee)
        
        feedback = []
        score_components = []
        
        # Depth check
        if knee_angle < self.thresholds['squat']['knee_angle_down']:
            if self.stage != "down":
                self.stage = "down"
            score_components.append(100)
        elif knee_angle < 120:
            score_components.append(70)
            feedback.append("Go deeper")
        else:
            if self.stage == "down":
                self.stage = "up"
                self.rep_count += 1
            score_components.append(50)
        
        # Back straightness
        if self.thresholds['squat']['back_angle_min'] < back_angle < self.thresholds['squat']['back_angle_max']:
            score_components.append(100)
        else:
            score_components.append(50)
            feedback.append("Keep back straight")
        
        # Knee alignment
        knee_x = knee[0]
        ankle_x = ankle[0]
        if abs(knee_x - ankle_x) < 0.1:
            score_components.append(100)
        else:
            score_components.append(60)
            if knee_x > ankle_x:
                feedback.append("Knees too forward")
        
        final_score = int(np.mean(score_components)) if score_components else 0
        
        return {
            'feedback': feedback,
            'score': final_score,
            'angles': {'knee': knee_angle, 'back': back_angle},
            'stage': self.stage,
            'reps': self.rep_count
        }
    
    def analyze_pushup(self, landmarks):
        """
        Analyze push-up form
        
        Args:
            landmarks: MediaPipe pose landmarks
            
        Returns:
            dict: {
                'feedback': List of correction messages,
                'score': Form accuracy score (0-100),
                'angles': Dict of joint angles,
                'stage': Current movement stage
            }
        """
        if not landmarks:
            return {'feedback': ['No pose detected'], 'score': 0, 'angles': {}, 'stage': None}
        
        # Get joint coordinates
        shoulder = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_SHOULDER.value)
        elbow = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_ELBOW.value)
        wrist = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_WRIST.value)
        hip = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_HIP.value)
        knee = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_KNEE.value)
        
        # Calculate angles
        elbow_angle = self.pose_detector.calculate_angle(shoulder, elbow, wrist)
        body_angle = self.pose_detector.calculate_angle(shoulder, hip, knee)
        
        feedback = []
        score_components = []
        
        # Depth check
        if elbow_angle < self.thresholds['pushup']['elbow_angle_down']:
            if self.stage != "down":
                self.stage = "down"
            score_components.append(100)
        elif elbow_angle < 120:
            score_components.append(70)
            feedback.append("Go lower")
        else:
            if self.stage == "down":
                self.stage = "up"
                self.rep_count += 1
            score_components.append(50)
        
        # Body alignment
        if self.thresholds['pushup']['body_angle_min'] < body_angle < self.thresholds['pushup']['body_angle_max']:
            score_components.append(100)
        else:
            score_components.append(50)
            if body_angle < self.thresholds['pushup']['body_angle_min']:
                feedback.append("Hips too low")
            else:
                feedback.append("Hips too high")
        
        final_score = int(np.mean(score_components)) if score_components else 0
        
        return {
            'feedback': feedback,
            'score': final_score,
            'angles': {'elbow': elbow_angle, 'body': body_angle},
            'stage': self.stage,
            'reps': self.rep_count
        }
    
    def analyze_plank(self, landmarks):
        """
        Analyze plank form
        
        Args:
            landmarks: MediaPipe pose landmarks
            
        Returns:
            dict: {
                'feedback': List of correction messages,
                'score': Form accuracy score (0-100),
                'angles': Dict of joint angles
            }
        """
        if not landmarks:
            return {'feedback': ['No pose detected'], 'score': 0, 'angles': {}}
        
        # Get joint coordinates
        shoulder = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_SHOULDER.value)
        hip = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_HIP.value)
        ankle = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_ANKLE.value)
        
        # Calculate body alignment angle
        body_angle = self.pose_detector.calculate_angle(shoulder, hip, ankle)
        
        feedback = []
        score_components = []
        
        # Body straightness
        if self.thresholds['plank']['body_angle_min'] < body_angle < self.thresholds['plank']['body_angle_max']:
            score_components.append(100)
        else:
            score_components.append(50)
            if body_angle < self.thresholds['plank']['body_angle_min']:
                feedback.append("Hips too low")
            else:
                feedback.append("Hips too high")
        
        final_score = int(np.mean(score_components)) if score_components else 0
        
        return {
            'feedback': feedback,
            'score': final_score,
            'angles': {'body': body_angle}
        }
    
    def analyze_lunge(self, landmarks):
        """
        Analyze lunge form (front-leg view, mirrors squat state machine)

        Args:
            landmarks: MediaPipe pose landmarks

        Returns:
            dict: {
                'feedback': List of correction messages,
                'score': Form accuracy score (0-100),
                'angles': Dict of joint angles,
                'stage': Current movement stage,
                'reps': Current rep count
            }
        """
        if not landmarks:
            return {'feedback': ['No pose detected'], 'score': 0, 'angles': {}, 'stage': None}

        hip = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_HIP.value)
        knee = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_KNEE.value)
        ankle = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_ANKLE.value)
        shoulder = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_SHOULDER.value)

        knee_angle = self.pose_detector.calculate_angle(hip, knee, ankle)
        back_angle = self.pose_detector.calculate_angle(shoulder, hip, knee)

        feedback = []
        score_components = []

        # Depth check (front leg)
        if knee_angle < self.thresholds['lunge']['knee_angle_down']:
            if self.stage != "down":
                self.stage = "down"
            score_components.append(100)
        elif knee_angle < 120:
            score_components.append(70)
            feedback.append("Drop deeper")
        else:
            if self.stage == "down":
                self.stage = "up"
                self.rep_count += 1
            score_components.append(50)

        # Torso uprightness
        if self.thresholds['lunge']['back_angle_min'] < back_angle < self.thresholds['lunge']['back_angle_max']:
            score_components.append(100)
        else:
            score_components.append(50)
            feedback.append("Keep torso upright")

        # Front knee tracking (knee should not drift far past ankle)
        if (knee[0] - ankle[0]) < 0.1:
            score_components.append(100)
        else:
            score_components.append(60)
            feedback.append("Front knee past toe")

        final_score = int(np.mean(score_components)) if score_components else 0

        return {
            'feedback': feedback,
            'score': final_score,
            'angles': {'knee': knee_angle, 'back': back_angle},
            'stage': self.stage,
            'reps': self.rep_count
        }

    def analyze_bicep_curl(self, landmarks):
        """
        Analyze bicep curl form using a single elbow angle.

        Args:
            landmarks: MediaPipe pose landmarks

        Returns:
            dict: {
                'feedback': List of correction messages,
                'score': Form accuracy score (0-100),
                'angles': Dict of joint angles,
                'stage': Current movement stage,
                'reps': Current rep count
            }
        """
        if not landmarks:
            return {'feedback': ['No pose detected'], 'score': 0, 'angles': {}, 'stage': None}

        shoulder = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_SHOULDER.value)
        elbow = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_ELBOW.value)
        wrist = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_WRIST.value)

        elbow_angle = self.pose_detector.calculate_angle(shoulder, elbow, wrist)

        feedback = []
        score_components = []

        # Stage 'down' = curled at top (small elbow angle); 'up' = arm extended.
        # Counts on the down -> up (curl-and-lower) transition, like squat.
        if elbow_angle < self.thresholds['bicep_curl']['elbow_flexed']:
            if self.stage != "down":
                self.stage = "down"
            score_components.append(100)
        elif elbow_angle < 110:
            score_components.append(70)
            feedback.append("Curl higher")
        elif elbow_angle > self.thresholds['bicep_curl']['elbow_extended']:
            if self.stage == "down":
                self.stage = "up"
                self.rep_count += 1
            score_components.append(100)
        else:
            score_components.append(70)

        # Elbow stability — shouldn't drift forward/back from shoulder line.
        if abs(elbow[0] - shoulder[0]) < self.thresholds['bicep_curl']['elbow_drift_max']:
            score_components.append(100)
        else:
            score_components.append(60)
            feedback.append("Keep elbow still")

        final_score = int(np.mean(score_components)) if score_components else 0

        return {
            'feedback': feedback,
            'score': final_score,
            'angles': {'elbow': elbow_angle},
            'stage': self.stage,
            'reps': self.rep_count
        }

    def analyze_shoulder_press(self, landmarks):
        """
        Analyze overhead shoulder press form.

        Args:
            landmarks: MediaPipe pose landmarks

        Returns:
            dict: {
                'feedback': List of correction messages,
                'score': Form accuracy score (0-100),
                'angles': Dict of joint angles,
                'stage': Current movement stage,
                'reps': Current rep count
            }
        """
        if not landmarks:
            return {'feedback': ['No pose detected'], 'score': 0, 'angles': {}, 'stage': None}

        shoulder = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_SHOULDER.value)
        elbow = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_ELBOW.value)
        wrist = self.pose_detector.get_landmark_coords(landmarks, self.mp_pose.PoseLandmark.LEFT_WRIST.value)

        elbow_angle = self.pose_detector.calculate_angle(shoulder, elbow, wrist)

        feedback = []
        score_components = []

        # MediaPipe y is top-down: smaller y = higher on screen.
        wrist_above_shoulder = wrist[1] < shoulder[1]

        # Stage 'down' = rack position (bent elbows, wrists at/below shoulder line).
        # Stage 'up'   = locked overhead (extended elbows, wrists above shoulders).
        if elbow_angle < self.thresholds['shoulder_press']['elbow_down'] and not wrist_above_shoulder:
            if self.stage != "down":
                self.stage = "down"
            score_components.append(100)
        elif elbow_angle > self.thresholds['shoulder_press']['elbow_up'] and wrist_above_shoulder:
            if self.stage == "down":
                self.stage = "up"
                self.rep_count += 1
            score_components.append(100)
        else:
            score_components.append(70)
            if elbow_angle > self.thresholds['shoulder_press']['elbow_up'] and not wrist_above_shoulder:
                feedback.append("Press higher")

        # Wrist should stack roughly over the elbow at lockout.
        if abs(wrist[0] - elbow[0]) < self.thresholds['shoulder_press']['wrist_stack_max']:
            score_components.append(100)
        else:
            score_components.append(60)
            feedback.append("Stack wrist over elbow")

        final_score = int(np.mean(score_components)) if score_components else 0

        return {
            'feedback': feedback,
            'score': final_score,
            'angles': {'elbow': elbow_angle},
            'stage': self.stage,
            'reps': self.rep_count
        }

    def reset_reps(self):
        """Reset rep counter and stage"""
        self.rep_count = 0
        self.stage = None
    
    def get_rep_count(self):
        """Get current rep count"""
        return self.rep_count
