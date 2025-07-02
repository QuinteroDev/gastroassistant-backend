# programs/serializers.py - Versión final con contenido integrado

from rest_framework import serializers
from .models import TreatmentProgram, UserProgram

class TreatmentProgramSerializer(serializers.ModelSerializer):
    """Serializer para detalles del programa de tratamiento"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = TreatmentProgram
        fields = [
            'id', 'name', 'type', 'type_display', 'description',
            'color_primary', 'color_secondary'
        ]

class UserProgramSerializer(serializers.ModelSerializer):
    """Serializer mejorado que incluye todo el contenido estructurado"""
    program = TreatmentProgramSerializer(read_only=True)
    profile_data = serializers.SerializerMethodField()
    program_content = serializers.SerializerMethodField()
    clinical_factors = serializers.SerializerMethodField()

    class Meta:
        model = UserProgram
        fields = ['id', 'program', 'assigned_at', 'completed', 'profile_data', 'program_content', 'clinical_factors']

    def get_profile_data(self, obj):
        """Obtiene datos del perfil necesarios para personalización"""
        profile = obj.user.profile
        
        return {
            'phenotype': profile.phenotype,
            'scenario': profile.scenario,
            'has_hernia': getattr(profile, 'has_hernia', 'NO'),
            'has_altered_motility': getattr(profile, 'has_altered_motility', 'NO'),
            'has_slow_emptying': getattr(profile, 'has_slow_emptying', 'NO'),
            'has_dry_mouth': getattr(profile, 'has_dry_mouth', 'NO'),
            'has_constipation': getattr(profile, 'has_constipation', 'NO'),
            'stress_affects': getattr(profile, 'stress_affects', 'NO'),
            'bmi': getattr(profile, 'bmi', None),
            'has_excess_weight': getattr(profile, 'has_excess_weight', False),
            'display_block': self._determine_display_block(profile)
        }

    def get_program_content(self, obj):
        """Devuelve el contenido del programa estructurado"""
        profile = obj.user.profile
        display_block = self._determine_display_block(profile)
        
        # Contenido de los bloques (movido desde el frontend)
        program_blocks = {
            1: {
                'title': 'ERGE Erosiva',
                'emoji': '🟩',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'En tu endoscopia se ha identificado una inflamación en el esófago, conocida como esofagitis erosiva. Esto confirma que tu reflujo está generando daño en el tejido esofágico, y requiere un abordaje médico adecuado.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante prestarle atención?',
                        'content': [
                            'La esofagitis puede producir síntomas como ardor, molestias al tragar, acidez o incluso dolor torácico.',
                            'En algunos casos, si no se trata bien, puede dar lugar a complicaciones como úlceras, estrechamiento del esófago o un tipo especial de cambio en la mucosa (llamado esófago de Barrett).',
                            'Por eso, este tipo de reflujo siempre debe ser supervisado por tu médico.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Evita acostarte justo después de comer. Espera al menos 2 horas antes de tumbarte o irte a dormir.',
                            'Evita las comidas muy copiosas, especialmente por la noche.',
                            'Eleva el cabecero de la cama si tienes molestias al dormir (puedes usar un alza o cuñas, no solo almohadas).',
                            'Reduce o elimina el tabaco y el alcohol, ya que pueden irritar la mucosa y empeorar el reflujo.',
                            'Pierde peso si tienes sobrepeso, ya que está demostrado que mejora los síntomas y favorece el control del reflujo.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el tratamiento médico?',
                        'content': 'Esta condición requiere un seguimiento profesional y posible tratamiento con medicación específica, indicado por tu médico. Si no estás en tratamiento actualmente o tienes síntomas persistentes, te recomendamos consultar lo antes posible con tu especialista.',
                        'icon': 'hospital-user'
                    }
                ]
            },
            2: {
                'title': 'ERGE No Erosiva (NERD)',
                'emoji': '🟨',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Tienes síntomas claros de reflujo, pero tu endoscopia no muestra lesiones visibles en el esófago. Sin embargo, las pruebas funcionales como la pH-metría han detectado una exposición anormal al reflujo ácido. Esto se conoce como ERGE no erosiva o NERD, y es una forma muy frecuente de reflujo.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante tenerlo en cuenta?',
                        'content': [
                            'Aunque no haya daño visible, los síntomas pueden ser igual de molestos o incapacitantes que en otros tipos de reflujo.',
                            'Muchas veces, este tipo de reflujo no responde del todo a la medicación y requiere una atención especial a los hábitos diarios.',
                            'Es importante no subestimar este perfil, ya que un buen manejo puede mejorar mucho tu calidad de vida.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Evita las comidas muy abundantes, especialmente si vas a estar inactivo o tumbado después.',
                            'No te acuestes inmediatamente después de comer. Espera al menos dos horas.',
                            'Reduce el consumo de tabaco y alcohol, si los tomas.',
                            'Si tienes sobrepeso, perder algo de peso puede ayudarte mucho con los síntomas.',
                            'Elevar ligeramente el cabecero de la cama puede ayudarte si tienes molestias por la noche.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Aunque tu endoscopia sea normal, es importante que sigas en contacto con tu médico si los síntomas persisten o interfieren con tu día a día. En algunos casos puede ser necesario ajustar el enfoque terapéutico o realizar seguimiento adicional.',
                        'icon': 'hospital-user'
                    }
                ]
            },
            3: {
                'title': 'Reflujo Extraesofágico',
                'emoji': '🟦',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Tus síntomas se relacionan con la garganta o el aparato respiratorio superior: carraspeo, ronquera, tos crónica, sensación de cuerpo extraño, etc. Estos casos se asocian con lo que se conoce como reflujo extraesofágico o "reflujo silencioso".',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante entenderlo?',
                        'content': [
                            'Este tipo de reflujo no siempre causa ardor o molestias típicas, por eso puede pasar desapercibido.',
                            'A veces se relaciona con el ascenso de pequeñas cantidades de ácido o contenido gástrico hacia la zona de la laringe o faringe.',
                            'Según la guía clínica, la relación entre estos síntomas y el reflujo no siempre está clara, pero muchos pacientes mejoran al modificar sus hábitos.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Evita las cenas copiosas o muy tardías. Es ideal cenar ligero y al menos 2–3 horas antes de acostarte.',
                            'No te tumbes inmediatamente después de comer.',
                            'Evita comidas que notes que aumentan la mucosidad o el carraspeo.',
                            'Si tienes síntomas nocturnos, puede ayudar elevar ligeramente el cabecero de la cama.',
                            'Reducir el alcohol y el tabaco, si están presentes, también puede ser beneficioso.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'La guía recomienda que si estos síntomas persisten, puede ser útil una evaluación adicional por otorrinolaringología o neumología, especialmente si no hay mejora tras cambios en el estilo de vida. Habla con tu médico si los síntomas se mantienen o interfieren en tu vida diaria.',
                        'icon': 'hospital-user'
                    }
                ]
            },
            4: {
                'title': 'Perfil Funcional/Hipersensibilidad',
                'emoji': '🟪',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'En tu caso, las pruebas digestivas realizadas no han mostrado reflujo ácido excesivo ni lesiones en el esófago. Aun así, los síntomas persisten. Esto puede deberse a una mayor sensibilidad del esófago o a una alteración funcional en la forma en la que tu cuerpo percibe ciertos estímulos. Es lo que se conoce como hipersensibilidad esofágica o pirosis funcional.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante entenderlo?',
                        'content': [
                            'Este tipo de diagnóstico no indica que no tengas nada: tus síntomas son reales, pero no se deben a un daño físico visible.',
                            'En estos casos, la guía clínica destaca que lo más útil es la educación y el abordaje desde el estilo de vida, más que tratamientos farmacológicos intensivos.',
                            'Factores como el estrés, la ansiedad, o incluso experiencias digestivas pasadas pueden influir en cómo percibes las molestias.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Mantener horarios de comida regulares y evitar saltarte comidas.',
                            'Comer tranquilo y sin distracciones, permitiendo que tu cuerpo digiera de forma natural.',
                            'Evitar comidas excesivas o muy rápidas, ya que pueden aumentar la sensación de malestar.',
                            'Si identificas algún alimento que te genera síntomas, puedes evitarlo, pero no es necesario restringir de forma estricta si no hay una causa clara.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Este tipo de diagnóstico suele confirmarse tras haber descartado otras causas mediante pruebas. Si no te has hecho una evaluación completa aún, coméntaselo a tu médico. Y si ya estás en seguimiento, puede ser útil complementar el abordaje con estrategias enfocadas en el bienestar digestivo y emocional.',
                        'icon': 'hospital-user'
                    }
                ]
            },
            5: {
                'title': 'Síntomas sin Pruebas',
                'emoji': '🟫',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Tienes síntomas compatibles con reflujo gastroesofágico o molestias relacionadas, pero aún no te has hecho pruebas digestivas específicas. Esto no significa que no haya un problema, pero sí que aún no se ha podido confirmar el tipo exacto de reflujo o su causa concreta.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante tenerlo en cuenta?',
                        'content': [
                            'La guía clínica indica que, si no hay signos de alarma, no es necesario hacer pruebas de inmediato.',
                            'Muchas personas mejoran significativamente al aplicar estrategias de estilo de vida, incluso antes de iniciar un tratamiento específico.',
                            'Aun así, si los síntomas persisten o aumentan, consultar con un médico es clave para avanzar en el diagnóstico.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Evita comidas copiosas, especialmente por la noche.',
                            'No te tumbes justo después de comer. Espera al menos 2 horas.',
                            'Si tienes sobrepeso, perder algo de peso puede ayudarte.',
                            'Evita alimentos o bebidas que claramente notes que te sientan mal. No es necesario eliminarlos todos si no hay una relación evidente.',
                            'Elevar ligeramente el cabecero de la cama puede ser útil si tienes molestias nocturnas.',
                            'Evita el tabaco y reduce el alcohol, si están presentes en tu día a día.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Si tus síntomas son persistentes, afectan a tu calidad de vida o no mejoras tras aplicar estas medidas, consulta con tu médico de cabecera o especialista en digestivo. Puede valorar si es necesario hacer una prueba como la endoscopia o la pH-metría para conocer mejor tu caso.',
                        'icon': 'hospital-user'
                    }
                ]
            },
            6: {
                'title': 'Bienestar Digestivo',
                'emoji': '⚪',
                'sections': [
                    {
                        'id': 'que_significa',
                        'title': '¿Qué significa tu perfil?',
                        'content': 'Según tus respuestas, no se detectan síntomas típicos de reflujo ni molestias digestivas relevantes en este momento. Tampoco hay constancia de pruebas digestivas con hallazgos que indiquen un problema activo.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es útil conocer esto?',
                        'content': [
                            'No tener síntomas ahora no significa que no debas cuidar tu digestión.',
                            'Prestar atención a tus hábitos puede ayudarte a mantener una buena salud digestiva a largo plazo.',
                            'Si en algún momento notas molestias, sabrás qué observar y cómo actuar de forma preventiva.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mantener una buena salud digestiva?',
                        'content': [
                            'Come tranquilo, sin prisas ni distracciones.',
                            'Evita comidas excesivas o muy tardías, especialmente si vas a acostarte después.',
                            'Mantén horarios regulares y una alimentación variada, según tu tolerancia.',
                            'Haz actividad física moderada a diario.',
                            'Hidrátate bien, pero sin excesos durante las comidas.',
                            'Intenta no fumar y limitar el alcohol, si lo consumes.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y si en algún momento aparecen síntomas?',
                        'content': 'Si en el futuro experimentas ardor, acidez, molestias digestivas, tos persistente o sensación de reflujo, te recomendamos repetir los cuestionarios y valorar una consulta médica si los síntomas persisten.',
                        'icon': 'hospital-user'
                    }
                ]
            }
        }
        
        return program_blocks.get(display_block, program_blocks[6])

    def get_clinical_factors(self, obj):
        """Obtiene los factores clínicos aplicables al usuario"""
        profile = obj.user.profile
        
        # Definición de factores clínicos (movido desde el frontend)
        clinical_factors_content = {
            'hernia': {
                'title': 'Hernia de hiato o cardias incompetente',
                'content': 'La hernia de hiato puede debilitar la barrera que separa el estómago del esófago, facilitando que los ácidos asciendan con más facilidad. Esto puede estar influyendo en tus síntomas. En tu caso, trabajar la respiración diafragmática y cuidar la postura abdominal puede ayudarte.',
                'tools': 'Respiración diafragmática, posturas correctas, evitar presión abdominal.',
                'icon': 'stomach'
            },
            'motility': {
                'title': 'Motilidad esofágica alterada',
                'content': 'Algunas personas tienen alteraciones en la forma en la que el esófago empuja los alimentos hacia el estómago. Si este movimiento está debilitado, el ácido puede quedar más tiempo en el esófago. Masticar bien, comer despacio y evitar mezclar alimentos sólidos con bebidas frías puede ayudarte.',
                'tools': 'Alimentación suave, registro de sensaciones, técnicas de masticación.',
                'icon': 'moving'
            },
            'emptying': {
                'title': 'Vaciamiento gástrico lento (gastroparesia)',
                'content': 'Cuando el estómago tarda mucho en vaciarse, aumenta la presión interna y eso puede favorecer el reflujo. En tu caso, hacer comidas pequeñas, repartidas y con bajo contenido graso puede ayudarte a sentirte mejor.',
                'tools': 'Comidas fraccionadas, pautas de vaciamiento, control de volumen.',
                'icon': 'hourglass-outline'
            },
            'saliva': {
                'title': 'Salivación reducida / sequedad bucal',
                'content': 'La saliva ayuda a neutralizar el ácido que asciende al esófago. Si tienes poca salivación, el aclaramiento natural se debilita. Beber agua a lo largo del día, evitar el tabaco y revisar efectos secundarios de medicamentos puede ser clave para mejorar.',
                'tools': 'Hidratación adecuada, higiene bucal, evitar alcohol/tabaco.',
                'icon': 'water-outline'
            },
            'constipation': {
                'title': 'Estreñimiento o esfuerzo al defecar',
                'content': 'El estreñimiento aumenta la presión abdominal y puede empeorar el reflujo. Mejorar tu evacuación puede tener un impacto positivo. Te recomendamos hidratarte bien, incluir fibra y usar un taburete para adoptar una mejor postura al defecar.',
                'tools': 'Aumento de fibra, uso de taburete, hidratación adecuada, actividad física.',
                'icon': 'pending-actions'
            },
            'stress_yes': {
                'title': 'Estrés o ansiedad como agravantes',
                'content': 'El estrés puede hacer que el cuerpo esté más sensible a los estímulos digestivos. Muchas personas sienten que sus síntomas aumentan en periodos de tensión. Trabajar el bienestar emocional también es parte del cuidado digestivo.',
                'tools': 'Respiración consciente, relajación guiada, diario emocional.',
                'icon': 'psychology'
            },
            'stress_sometimes': {
                'title': 'Manejo ocasional del estrés',
                'content': 'Notas que a veces el estrés influye en tus síntomas digestivos. Esto es normal y parte de la conexión mente-intestino. Tener algunas estrategias básicas de manejo del estrés puede ser beneficioso para tu bienestar digestivo.',
                'tools': 'Técnicas de relajación básicas, mindfulness simple.',
                'icon': 'psychology'
            },
            'bmi_high': {
                'title': 'El peso y tus síntomas digestivos',
                'content': 'Tu índice de masa corporal (IMC) sugiere que podrías tener un exceso de peso corporal. Esto no es una crítica, sino una información relevante que puede ayudarte a entender mejor tus síntomas digestivos. El exceso de peso abdominal puede aumentar la presión en el estómago y favorecer el reflujo.',
                'tools': 'Plan de movimiento moderado, pautas alimentarias progresivas, seguimiento de hábitos digestivos.',
                'icon': 'monitor-weight'
            }
        }
        
        applicable_factors = []
        
        # Verificar qué factores aplican al usuario
        if getattr(profile, 'has_hernia', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['hernia'])
        
        if getattr(profile, 'has_altered_motility', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['motility'])
        
        if getattr(profile, 'has_slow_emptying', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['emptying'])
        
        if getattr(profile, 'has_dry_mouth', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['saliva'])
        
        if getattr(profile, 'has_constipation', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['constipation'])
        
        if getattr(profile, 'stress_affects', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['stress_yes'])
        elif getattr(profile, 'stress_affects', 'NO') == 'SOMETIMES':
            applicable_factors.append(clinical_factors_content['stress_sometimes'])
        
        if getattr(profile, 'has_excess_weight', False):
            applicable_factors.append(clinical_factors_content['bmi_high'])
        
        return applicable_factors

    def _determine_display_block(self, profile):
        """Determina qué bloque mostrar basado en el perfil"""
        phenotype = profile.phenotype
        scenario = profile.scenario
        
        if phenotype == 'EROSIVE' or scenario in ['A', 'J']:
            return 1  # ERGE Erosiva
        elif phenotype == 'NERD' or scenario in ['B', 'K']:
            return 2  # ERGE No Erosiva
        elif phenotype == 'EXTRAESOPHAGEAL' or scenario in ['C', 'L']:
            return 3  # Reflujo Extraesofágico
        elif phenotype == 'FUNCTIONAL' or scenario in ['D', 'H']:
            return 4  # Perfil Funcional
        elif phenotype in ['SYMPTOMS_NO_TESTS', 'EXTRAESOPHAGEAL_NO_TESTS'] or scenario in ['E', 'F', 'G']:
            return 5  # Síntomas sin pruebas
        else:
            return 6  # Bienestar digestivo