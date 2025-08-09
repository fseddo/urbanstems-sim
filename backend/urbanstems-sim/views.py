from django.shortcuts import render
from rest_framework import viewsets
from .serializers import FlowerSerializer, AddOnItemSerializer
from .models import Flower, AddOnItem

# Create your views here.

class FlowerView(viewsets.ModelViewSet):
    serializer_class = FlowerSerializer
    queryset = Flower.objects.all()

class AddOnItemView(viewsets.ModelViewSet):
    serializer_class = AddOnItemSerializer
    queryset = AddOnItem.objects.all()