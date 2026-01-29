#!/bin/bash

echo "Setting up Mental Health App..."

# Backend setup
echo "Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
echo "Would you like to create a superuser? (y/n)"
read -r response
if [ "$response" = "y" ]; then
    python manage.py createsuperuser
fi

# Seed initial data
python manage.py seed_data

cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend

# Install dependencies
npm install

cd ..

echo "Setup complete!"
echo ""
echo "To start the backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "To start the frontend:"
echo "  cd frontend"
echo "  npm run dev"

