
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface FamilyMember {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string;
  death_date: string;
  is_alive: boolean;
  biography: string;
  image_url: string;
  marital_status: string;
  family_id: string;
  father_id: string;
  mother_id: string;
  spouse_id: string;
  is_founder: boolean;
  created_by: string;
  related_person_id: string;
  created_at: string;
  updated_at: string;
  relationship: string;
  additional_info: string;
  order: number;
}

interface EditModalProps {
  member: FamilyMember;
  onSave: (memberData: Partial<FamilyMember>, imageFile?: File) => void;
  onCancel: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ member, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<FamilyMember>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    setFormData(member);
  }, [member]);

  const handleInputChange = (field: keyof FamilyMember, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, imageFile || undefined);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
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
            <div className="flex items-center space-x-2">
              <Switch
                id="is_alive"
                checked={formData.is_alive || false}
                onCheckedChange={(checked) => handleInputChange('is_alive', checked)}
              />
              <Label htmlFor="is_alive">Is Alive</Label>
            </div>
          </div>

          {!formData.is_alive && (
            <div>
              <Label htmlFor="death_date">Death Date</Label>
              <Input
                id="death_date"
                type="date"
                value={formData.death_date || ''}
                onChange={(e) => handleInputChange('death_date', e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="marital_status">Marital Status</Label>
            <Select value={formData.marital_status || ''} onValueChange={(value) => handleInputChange('marital_status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
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

          <div>
            <Label htmlFor="image">Profile Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {formData.image_url && (
              <img
                src={formData.image_url}
                alt="Current"
                className="mt-2 w-20 h-20 object-cover rounded"
              />
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditModal;
