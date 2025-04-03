#-----------------------------------------------------------------------------------------------------------------------
# IMPORTS
#-----------------------------------------------------------------------------------------------------------------------

import torch
import torch.nn as nn
import torch.optim as optim
import os
from tqdm import tqdm
from torchvision import datasets, transforms
from torch.utils.data import DataLoader

#-----------------------------------------------------------------------------------------------------------------------
# DEVICE SETUP
#-----------------------------------------------------------------------------------------------------------------------

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

#-----------------------------------------------------------------------------------------------------------------------
# DATA LOADING
#-----------------------------------------------------------------------------------------------------------------------

transform = transforms.Compose([
    transforms.Resize((128, 128)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

train_data = datasets.ImageFolder(root='dataset/train', transform=transform)
val_data = datasets.ImageFolder(root='dataset/val', transform=transform)

train_loader = DataLoader(train_data, batch_size=32, shuffle=True)
val_loader = DataLoader(val_data, batch_size=32, shuffle=False)

num_classes = len(train_data.classes)

#-----------------------------------------------------------------------------------------------------------------------
# MODEL ARCHITECTURE
#-----------------------------------------------------------------------------------------------------------------------

class ConvNet(nn.Module):
    def __init__(self, num_classes):
        super(ConvNet, self).__init__()

        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1)

        self.pool = nn.MaxPool2d(2, 2)

        self.fc1 = nn.Linear(128 * 16 * 16, 512)
        self.fc2 = nn.Linear(512, num_classes)

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = self.pool(torch.relu(self.conv3(x)))

        x = x.view(-1, 128 * 16 * 16)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x


model = ConvNet(num_classes).to(device)

#-----------------------------------------------------------------------------------------------------------------------
# TRAINING SETUP
#-----------------------------------------------------------------------------------------------------------------------

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

#-----------------------------------------------------------------------------------------------------------------------
# TRAINING LOOP
#-----------------------------------------------------------------------------------------------------------------------

num_epochs = 10

for epoch in range(num_epochs):
    model.train()
    running_loss = 0.0

    progress_bar = tqdm(train_loader, desc=f"Epoch {epoch + 1}/{num_epochs}", leave=True)

    for images, labels in progress_bar:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)

        loss.backward()
        optimizer.step()

        running_loss += loss.item()

        # Update tqdm progress bar with loss
        progress_bar.set_postfix(loss=f"{loss.item():.4f}")

    print(f"Epoch [{epoch + 1}/{num_epochs}] Completed. Avg Loss: {running_loss / len(train_loader):.4f}")

    print(torch.cuda.is_available())  # Should return True if GPU is available