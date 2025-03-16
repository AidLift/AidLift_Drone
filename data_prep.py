import os
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

# Define image transforms (resizing, normalization, etc.)
transform = transforms.Compose([
    transforms.Resize((128, 128)),  # Resize images to 128x128
    transforms.ToTensor(),  # Convert image to tensor
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # Normalize
])

# Load datasets
train_data = datasets.ImageFolder(root='dataset/train', transform=transform)
val_data = datasets.ImageFolder(root='dataset/val', transform=transform)

# Create data loaders
train_loader = DataLoader(train_data, batch_size=32, shuffle=True)
val_loader = DataLoader(val_data, batch_size=32, shuffle=False)
