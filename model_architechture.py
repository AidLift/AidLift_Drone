#-----------------------------------------------------------------------------------------------------------------------
# IMPORTS
#-----------------------------------------------------------------------------------------------------------------------
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from tqdm import tqdm
import os
import multiprocessing
multiprocessing.set_start_method('spawn', force=True)

# Add this for Windows multiprocessing support
from multiprocessing import freeze_support

#-------------------------------------------------------------------------------------------------------------------
# MODEL ARCHITECTURE
#-------------------------------------------------------------------------------------------------------------------
class ConvNet(nn.Module):
    def __init__(self, num_classes):
        super(ConvNet, self).__init__()
        
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout(0.5)
        
        self.fc1 = nn.Linear(128 * 32 * 32, 512)
        self.fc2 = nn.Linear(512, num_classes)

    def forward(self, x):
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        
        x = x.view(-1, 128 * 32 * 32)
        x = self.dropout(F.relu(self.fc1(x)))
        x = self.fc2(x)
        return x
    
#-----------------------------------------------------------------------------------------------------------------------
# MAIN FUNCTION
#-----------------------------------------------------------------------------------------------------------------------
def main():
    #-------------------------------------------------------------------------------------------------------------------
    # DEVICE SETUP
    #-------------------------------------------------------------------------------------------------------------------
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    print(f"CUDA available: {torch.cuda.is_available()}")

    #-------------------------------------------------------------------------------------------------------------------
    # DATA LOADING WITH AUGMENTATION (SINGLE WORKER FOR STABILITY)
    #-------------------------------------------------------------------------------------------------------------------
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_data = datasets.ImageFolder(root='dataset/train', transform=train_transform)
    val_data = datasets.ImageFolder(root='dataset/val', transform=val_transform)

    # Changed num_workers to 0 for stability on Windows
    train_loader = DataLoader(train_data, batch_size=32, shuffle=True, num_workers=0, pin_memory=True)
    val_loader = DataLoader(val_data, batch_size=32, shuffle=False, num_workers=0, pin_memory=True)

    num_classes = len(train_data.classes)
    print(f"Number of classes: {num_classes}")


    model = ConvNet(num_classes).to(device)
    print(model)

    #-------------------------------------------------------------------------------------------------------------------
    # TRAINING SETUP
    #-------------------------------------------------------------------------------------------------------------------
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=2, verbose=True)
    scaler = torch.cuda.amp.GradScaler()

    #-------------------------------------------------------------------------------------------------------------------
    # TRAINING LOOP
    #-------------------------------------------------------------------------------------------------------------------
    num_epochs = 20
    best_val_loss = float('inf')
    patience = 3
    no_improve = 0

    for epoch in range(num_epochs):
        # Training Phase
        model.train()
        train_loss = 0.0
        
        progress_bar = tqdm(train_loader, desc=f"Epoch {epoch + 1}/{num_epochs}")
        for images, labels in progress_bar:
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            
            with torch.cuda.amp.autocast():
                outputs = model(images)
                loss = criterion(outputs, labels)
            
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            
            train_loss += loss.item()
            progress_bar.set_postfix(loss=f"{loss.item():.4f}")

        # Validation Phase
        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item()
                
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        
        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        val_accuracy = 100 * correct / total
        
        print(f"\nEpoch {epoch + 1}/{num_epochs}")
        print(f"Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f}")
        print(f"Val Accuracy: {val_accuracy:.2f}%")
        
        scheduler.step(avg_val_loss)
        
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            no_improve = 0
            torch.save(model.state_dict(), 'best_model.pth')
            print("Validation loss improved - model saved")
        else:
            no_improve += 1
            print(f"No improvement in validation loss for {no_improve}/{patience} epochs")
            if no_improve == patience:
                print(f"Early stopping at epoch {epoch + 1}")
                break

    print("Training complete!")

#-----------------------------------------------------------------------------------------------------------------------
# ENTRY POINT (CRUCIAL FOR WINDOWS MULTIPROCESSING)
#-----------------------------------------------------------------------------------------------------------------------
if __name__ == '__main__':
    freeze_support()  # Required for Windows
    main()
