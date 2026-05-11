# Datasets Directory

Store all training and testing datasets here.

## Recommended Datasets:


### 1. Pose Detection
- **MPII Human Pose Dataset**: http://human-pose.mpi-inf.mpg.de/
- **COCO Keypoints**: https://cocodataset.org/#keypoints-2020
- **Yoga-82 Dataset**: https://sites.google.com/view/yoga-82/home

### 2. Exercise Videos
- **Kinetics-700**: https://deepmind.com/research/open-source/kinetics
- **UCF101**: https://www.crcv.ucf.edu/data/UCF101.php

### 3. Nutrition
- **Food-101**: https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/
- **Open Food Facts**: https://world.openfoodfacts.org/data
- **USDA Food Database**: https://fdc.nal.usda.gov/

### 4. Health & Fitness
- **UCI Machine Learning Repository - Fitness**: https://archive.ics.uci.edu/ml/datasets.php

## Dataset Structure:
```
datasets/
├── pose_detection/
│   ├── training/
│   └── validation/
├── exercises/
│   ├── squats/
│   ├── pushups/
│   └── ...
├── nutrition/
│   └── food_database.csv
└── user_data/
    └── sample_profiles.json
```

## Notes:
- Keep datasets organized by module
- Don't commit large files to git (use .gitignore)
- Document data sources and preprocessing steps
