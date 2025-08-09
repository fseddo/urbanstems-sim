from django.db import models
from django.core.validators import MaxValueValidator

class Occasion(models.TextChoices):
    ANNIVERSARY = "ANNIVERSARY", "Anniversary"
    BIRTHDAY = "BIRTHDAY", "Birthday"
    CONGRATULATIONS = "CONGRATULATIONS", "Congratulations"
    HOUSEWARMING = "HOUSEWARMING", "Housewarming"
    JUST_BECAUSE = "JUST_BECAUSE", "Just Because"
    SYMPATHY = "SYMPATHY", "Sympathy"
    THANK_YOU = "THANK_YOU", "Thank You"


class Collection(models.TextChoices):
    BURLAP_WRAPPED = "BURLAP_WRAPPED", "Burlap Wrapped"
    VASE_VASE_BABY = "VASE_VASE_BABY", "Vase, Vase Baby"
    FREE_SHIP_SHOP = "FREE_SHIP_SHOP", "Free Ship Shop"
    OUR_FAVORITES = "OUR_FAVORITES", "Our Favorites"
    BIG_BOX_SHOP = "BIG_BOX_SHOP", "Big Box Shop"
    WITH_HEART = "WITH_HEART", "With Heart"
    PET_FRIENDLY = "PET_FRIENDLY", "Pet Friendly"
    PLANTS = "PLANTS", "Plants"
    WREATHS = "WREATHS", "Wreaths"


class FlowerType(models.TextChoices):
    ALSTROEMERIA = "ALSTROEMERIA", "Alstroemeria"
    ANEMONES = "ANEMONES", "Anemones"
    DAISIES = "DAISIES", "Daisies"
    HYDRANGEA = "HYDRANGEA", "Hydrangea"
    LILIES = "LILIES", "Lilies"
    PEONIES = "PEONIES", "Peonies"
    RANUNCULUS = "RANUNCULUS", "Ranunculus"
    ROSES = "ROSES", "Roses"
    ROSELILIES = "ROSELILIES", "Roselilies"
    SPECIALTY_GARDEN_ROSES = "SPECIALTY_GARDEN_ROSES", "Specialty Garden Roses"
    SUNFLOWERS = "SUNFLOWERS", "Sunflowers"



# Create your models here.

class Flower(models.Model):
    name = models.CharField(max_length=120)
    occasion = models.CharField(max_length=50, choices=Occasion.choices, null=True, blank=True)
    collection = models.CharField(max_length=50, choices=Collection.choices, null=True, blank=True)
    type = models.CharField(max_length=50, choices=FlowerType.choices, null=True, blank=True)
    price = models.PositiveIntegerField()
    image_urls = models.JSONField(default=list)
    description = models.TextField()
    details = models.JSONField(default=list)
    pet_safe = models.BooleanField(null=True, blank=True)
    is_single_variety = models.BooleanField(default=False)
    discount = models.PositiveIntegerField(
        validators=[MaxValueValidator(99)],
        default=0, 
        blank=True
    )
    amount_in_stock = models.PositiveIntegerField(default=0)
    delivery_lead_time = models.PositiveIntegerField(null=True)

    def __str__(self):
        return self.name
    


class AddOnItem(models.Model):
    name = models.CharField(max_length=120)
    price = models.PositiveIntegerField()
    description = models.TextField()
    image_url = models.CharField(max_length=500)
    amount_in_stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name