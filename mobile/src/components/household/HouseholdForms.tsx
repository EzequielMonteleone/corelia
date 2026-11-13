import {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {Button} from '@/components/ui/Button';
import type {
  HouseholdMember,
  HouseholdMemberInput,
  HouseholdRelation,
  Pet,
  PetInput,
  PetSpecies,
  Vehicle,
  VehicleInput,
} from '@/types/household';
import {spacing} from '@/theme';

const RELATIONS: {value: HouseholdRelation; label: string}[] = [
  {value: 'SPOUSE', label: 'Cónyuge'},
  {value: 'CHILD', label: 'Hijo/a'},
  {value: 'PARENT', label: 'Padre/madre'},
  {value: 'OTHER', label: 'Otro'},
];

const SPECIES: {value: PetSpecies; label: string}[] = [
  {value: 'DOG', label: 'Perro'},
  {value: 'CAT', label: 'Gato'},
  {value: 'OTHER', label: 'Otro'},
];

function Actions({
  pending,
  canSubmit,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.actions}>
      <Button
        title="Cancelar"
        variant="ghost"
        onPress={onCancel}
        disabled={pending}
        style={styles.action}
      />
      <Button
        title="Guardar"
        onPress={onSubmit}
        loading={pending}
        disabled={!canSubmit}
        style={styles.action}
      />
    </View>
  );
}

export function MemberForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: HouseholdMember | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: HouseholdMemberInput) => void;
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [relation, setRelation] = useState<HouseholdRelation>(
    initial?.relation ?? 'OTHER',
  );
  const [documentNumber, setDocumentNumber] = useState(
    initial?.documentNumber ?? '',
  );
  const [phone, setPhone] = useState(initial?.phone ?? '');

  const canSubmit = !!firstName.trim() && !!lastName.trim();

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      relation,
      ...(documentNumber.trim()
        ? {documentNumber: documentNumber.trim()}
        : {}),
      ...(phone.trim() ? {phone: phone.trim()} : {}),
    });
  };

  return (
    <View style={styles.form}>
      <Input label="Nombre" value={firstName} onChangeText={setFirstName} />
      <Input label="Apellido" value={lastName} onChangeText={setLastName} />
      <Select
        label="Parentesco"
        value={relation}
        onChange={value => setRelation(value as HouseholdRelation)}
        options={RELATIONS}
      />
      <Input
        label="Documento"
        value={documentNumber}
        onChangeText={setDocumentNumber}
      />
      <Input label="Teléfono" value={phone} onChangeText={setPhone} />
      <Actions
        pending={pending}
        canSubmit={canSubmit}
        onCancel={onCancel}
        onSubmit={submit}
      />
    </View>
  );
}

export function VehicleForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: Vehicle | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: VehicleInput) => void;
}) {
  const [plate, setPlate] = useState(initial?.plate ?? '');
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [color, setColor] = useState(initial?.color ?? '');

  const canSubmit = !!plate.trim();

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      plate: plate.trim(),
      ...(make.trim() ? {make: make.trim()} : {}),
      ...(model.trim() ? {model: model.trim()} : {}),
      ...(color.trim() ? {color: color.trim()} : {}),
    });
  };

  return (
    <View style={styles.form}>
      <Input
        label="Patente"
        value={plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
      />
      <Input label="Marca" value={make} onChangeText={setMake} />
      <Input label="Modelo" value={model} onChangeText={setModel} />
      <Input label="Color" value={color} onChangeText={setColor} />
      <Actions
        pending={pending}
        canSubmit={canSubmit}
        onCancel={onCancel}
        onSubmit={submit}
      />
    </View>
  );
}

export function PetForm({
  initial,
  pending,
  onCancel,
  onSubmit,
}: {
  initial?: Pet | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: PetInput) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [species, setSpecies] = useState<PetSpecies>(initial?.species ?? 'DOG');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const canSubmit = !!name.trim();

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      species,
      ...(notes.trim() ? {notes: notes.trim()} : {}),
    });
  };

  return (
    <View style={styles.form}>
      <Input label="Nombre" value={name} onChangeText={setName} />
      <Select
        label="Especie"
        value={species}
        onChange={value => setSpecies(value as PetSpecies)}
        options={SPECIES}
      />
      <Input label="Notas" value={notes} onChangeText={setNotes} multiline />
      <Actions
        pending={pending}
        canSubmit={canSubmit}
        onCancel={onCancel}
        onSubmit={submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {gap: spacing.md},
  actions: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs},
  action: {flex: 1},
});
