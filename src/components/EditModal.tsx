import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface FamilyMember {
  id: string;
  name: string;
  gender?: string;
  image_url?: string;
  birth_date?: string;
  death_date?: string;
  is_alive?: boolean;
  biography?: string;
  first_name?: string;
  last_name?: string;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  onSave: (member: FamilyMember) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImage: File | null;
  onDelete: () => void;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  member,
  onSave,
  onImageChange,
  selectedImage,
  onDelete,
}) => {
  const [formData, setFormData] = useState<FamilyMember>({
    id: '',
    name: '',
    gender: 'male',
    birth_date: '',
    death_date: '',
    is_alive: true,
    biography: '',
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    if (member) {
      setFormData(member);
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof FamilyMember, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Family Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image">Profile Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={onImageChange}
            />
            {selectedImage && (
              <p className="text-sm text-muted-foreground mt-1">
                New image selected: {selectedImage.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date || ''}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="death_date">Death Date</Label>
              <Input
                id="death_date"
                type="date"
                value={formData.death_date || ''}
                onChange={(e) => handleInputChange('death_date', e.target.value)}
                disabled={formData.is_alive}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_alive"
              checked={formData.is_alive}
              onCheckedChange={(checked) => handleInputChange('is_alive', checked)}
            />
            <Label htmlFor="is_alive">Is Alive</Label>
          </div>

          <div>
            <Label htmlFor="biography">Biography</Label>
            <Textarea
              id="biography"
              value={formData.biography || ''}
              onChange={(e) => handleInputChange('biography', e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="flex justify-between">
            <Button type="button" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditModal;