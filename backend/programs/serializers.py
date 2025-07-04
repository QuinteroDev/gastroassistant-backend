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
                        'content': 'En tu endoscopia se ha identificado una inflamación en el esófago, conocida como esofagitis erosiva. Esto confirma que el reflujo está dañando el tejido esofágico, por lo que es importante actuar con un enfoque médico y de hábitos.',
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
                            'Evita acostarte justo después de comer. Espera al menos 3 horas antes de tumbarte o irte a dormir.',
                            'Cenas ligeras y sin prisas. Las comidas copiosas, especialmente por la noche, agravan los síntomas.',
                            'Si tienes molestias nocturnas, eleva el cabecero de la cama (mejor con alza o cuñas que con almohadas).',
                            'Come sin prisa, masticando bien cada bocado y en un entorno tranquilo.',
                            'Bebe en sorbos pequeños durante el día, preferiblemente lejos de las comidas.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el tratamiento médico?',
                        'content': 'La esofagitis erosiva siempre requiere seguimiento médico para valorar la evolución y ajustar el tratamiento si es necesario. Lo que haces aquí en GastroAssistant no sustituye esa supervisión, pero puede marcar la diferencia. Mientras sigues el tratamiento pautado por tu especialista, aquí encontrarás hábitos y pautas que te ayudarán a aliviar síntomas y favorecer la recuperación. Tus acciones diarias cuentan —y mucho— en el proceso de mejora.',
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
                        'content': 'Tienes síntomas claros de reflujo, pero la endoscopia no muestra daño visible en el esófago. Sin embargo, la pH-metría ha confirmado que hay un exceso de reflujo ácido. Esto se conoce como ERGE no erosiva o NERD, una forma muy frecuente de reflujo.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante tenerlo en cuenta?',
                        'content': [
                            'La ausencia de lesiones visibles no hace que los síntomas sean menos molestos o incapacitantes.',
                            'Este tipo de reflujo puede mostrar una respuesta limitada al tratamiento farmacológico, por lo que las medidas de estilo de vida son fundamentales.',
                            'La buena noticia es que, con el enfoque adecuado, puedes recuperar el control y sentirte mucho mejor.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Mastica bien la comida, come sin prisa y sin distracciones. Esto mejora la digestión y reduce los síntomas.',
                            'Evita tumbarte después de comer. Espera al menos 3 horas antes de acostarte.',
                            'Cenas ligeras: evita las comidas copiosas, especialmente por la noche.',
                            'Bebe en sorbos pequeños entre comidas, evitando beber durante la comida.',
                            'Dormir del lado izquierdo puede ayudarte a vaciar el estómago más fácilmente.',
                            'Evita alimentos o bebidas que claramente notes que te sientan mal, pero no hagas restricciones excesivas si no hay una relación clara.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Una endoscopia sin lesiones es un buen punto de partida, pero no significa que todo esté resuelto. Si los síntomas siguen presentes, es importante revisar la situación con tu médico. Mantener revisiones periódicas y avanzar con los hábitos adecuados es la mejor forma de recuperar el equilibrio digestivo.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'En GastroAssistant no esperas a que todo pase solo: te damos herramientas prácticas para que avances, incluso cuando las pruebas no muestran alteraciones.',
                        'icon': 'checkmark-circle'
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
                        'content': 'Tus síntomas afectan principalmente a la garganta o al sistema respiratorio superior: carraspeo, ronquera, tos crónica, sensación de cuerpo extraño, entre otros. Este patrón se asocia a lo que se conoce como reflujo extraesofágico o "reflujo silencioso", ya que a menudo ocurre sin los síntomas clásicos de acidez o ardor. En algunos casos, pueden coexistir ambos tipos de síntomas, tanto digestivos como respiratorios, lo que refuerza la sospecha de reflujo.',
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
                            'Evita las cenas copiosas o muy tardías. Es ideal cenar ligero y al menos 3 horas antes de acostarte.',
                            'No te tumbes inmediatamente después de comer.',
                            'Reduce alimentos que notes que aumentan tu mucosidad o el carraspeo. En estos casos, algunas personas experimentan más sensibilidad con alimentos muy ácidos, como cítricos o vinagres.',
                            'Evita el carraspeo habitual para romper el círculo vicioso de tos y aclaramiento constante.',
                            'En lugar de aclarar la garganta, mantén una buena hidratación a lo largo del día, tomando sorbos pequeños y frecuentes, preferiblemente entre comidas. Esto ayuda a romper el círculo vicioso de carraspeo y tos.',
                            'Si tienes síntomas nocturnos, puede ayudarte elevar ligeramente el cabecero de la cama y dormir del lado izquierdo.',
                            'Come tranquilo, sin distracciones, y mastica bien cada bocado para facilitar la digestión.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'La guía recomienda que si estos síntomas persisten, puede ser útil una evaluación adicional por otorrinolaringología o neumología, especialmente si no hay mejora tras cambios en el estilo de vida. Habla con tu médico si los síntomas se mantienen o interfieren en tu vida diaria. Aunque los síntomas de garganta o respiratorios no siempre se deben al reflujo ácido, en tu caso sí podrían estar relacionados. Por eso, adoptar medidas enfocadas en reducir el reflujo podría ayudarte a aliviarlos de forma progresiva.',
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
                        'content': 'En tu caso, las pruebas digestivas no han mostrado reflujo ácido excesivo ni lesiones en el esófago. Aun así, los síntomas persisten. Esto puede deberse a una mayor sensibilidad del esófago o a una alteración funcional en la forma en que tu cuerpo percibe ciertos estímulos. Es lo que se conoce como hipersensibilidad esofágica o pirosis funcional.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante entenderlo?',
                        'content': [
                            'Este diagnóstico no significa que "no tengas nada": tus síntomas son reales, pero no se deben a un daño físico visible.',
                            'En estos casos, la guía clínica destaca que lo más útil es el enfoque educativo y los cambios en el estilo de vida, más que tratamientos farmacológicos intensivos.',
                            'Factores como el estrés, la ansiedad o haber tenido problemas digestivos durante mucho tiempo pueden hacer que el cuerpo se vuelva más sensible y reaccione con más intensidad, aunque las pruebas estén bien.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Come en un entorno tranquilo, sin prisas ni distracciones. Masticar bien ayuda a reducir la carga digestiva.',
                            'Hacer unas respiraciones profundas antes de empezar a comer puede ayudarte a relajarte y digerir mejor.',
                            'Evita comidas muy rápidas o muy abundantes, ya que pueden aumentar la sensación de malestar.',
                            'Escucha tu cuerpo: si algún alimento te genera molestias claras, puedes reducirlo, pero no es necesario hacer muchas eliminaciones si no hay una causa identificada.',
                            'Mantén horarios regulares para las comidas y deja suficiente tiempo antes de acostarte.',
                            'Hidrátate bien durante el día y evita grandes cantidades de líquido durante las comidas.',
                            'En los trastornos funcionales digestivos, la evidencia sobre el papel de la terapia psicológica (como la terapia cognitivo-conductual o estrategias de regulación emocional) es cada vez más clara. Este tipo de apoyo puede ayudarte a reducir la intensidad del malestar, mejorar la percepción de los síntomas y acompañarte en el proceso de recuperación.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Este tipo de diagnóstico suele confirmarse tras descartar otras causas mediante pruebas. Si no te has hecho una evaluación completa, coméntaselo a tu médico. Y si ya estás en seguimiento, puede ser útil complementar el abordaje con herramientas centradas en tu bienestar digestivo y emocional. En los perfiles funcionales, el apoyo psicológico puede ser un recurso valioso para gestionar mejor los síntomas y reducir su impacto en tu día a día.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'A veces, los síntomas digestivos persisten aunque las pruebas salgan bien. Eso no significa que no exista un problema, sino que su origen puede estar en cómo funciona el sistema digestivo, más que en un daño visible. Con un enfoque centrado en tus hábitos y bienestar, puedes avanzar y sentirte cada vez mejor.',
                        'icon': 'checkmark-circle'
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
                        'content': 'Tus respuestas en los cuestionarios sugieren un perfil compatible con reflujo o molestias digestivas relevantes. Si los síntomas persisten, interfieren con tu calidad de vida o han ido en aumento, es recomendable comentarlo con tu médico de cabecera o especialista en digestivo. Él o ella podrá valorar si es necesario realizar pruebas para conocer mejor tu caso.',
                        'icon': 'psychology'
                    },
                    {
                        'id': 'por_que_importante',
                        'title': '¿Por qué es importante tenerlo en cuenta?',
                        'content': [
                            'Si no hay signos de alarma, las guías clínicas indican que no siempre es necesario hacer pruebas de forma inmediata.',
                            'Muchas personas mejoran aplicando cambios en sus hábitos, incluso antes de recibir un diagnóstico confirmado.',
                            'Aun así, si los síntomas persisten o aumentan, consultar con un médico es clave para avanzar en el diagnóstico.'
                        ],
                        'icon': 'alert-circle'
                    },
                    {
                        'id': 'que_hacer',
                        'title': '¿Qué puedes hacer tú para mejorar?',
                        'content': [
                            'Evita tumbarte justo después de comer. Espera al menos 2 horas antes de acostarte.',
                            'Mantén cenas ligeras, y deja un margen suficiente entre la última comida y el momento de dormir.',
                            'Come sin prisas, en un entorno tranquilo, masticando bien cada bocado.',
                            'Identifica si hay alimentos o bebidas que claramente te sientan mal y evítalos, sin necesidad de hacer restricciones muy amplias.',
                            'Hidrátate con sorbos pequeños a lo largo del día, mejor entre comidas.',
                            'Dormir del lado izquierdo y elevar ligeramente el cabecero puede ayudarte si tienes molestias nocturnas.',
                            'Adoptar estos hábitos puede ayudarte a aliviar los síntomas mientras avanzas con el estudio médico y defines el enfoque más adecuado para tu caso.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y el seguimiento médico?',
                        'content': 'Si tus síntomas son persistentes, afectan a tu calidad de vida o no mejoras tras aplicar estas medidas, consulta con tu médico de cabecera o especialista en digestivo. Puede valorar si es necesario hacer una prueba como la endoscopia o la pH-metría para conocer mejor tu caso.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'Muchas personas comienzan a mejorar antes incluso de tener un diagnóstico completo, simplemente aplicando cambios clave en sus hábitos. Pero si los síntomas persisten, no lo ignores: dar el paso hacia una evaluación puede ser lo que necesites para avanzar.',
                        'icon': 'checkmark-circle'
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
                            'Come tranquilo, sin distracciones ni prisas, y mastica bien cada bocado.',
                            'Evita comidas muy abundantes o muy tardías, especialmente si vas a acostarte después.',
                            'Prioriza el descanso.',
                            'Evita productos y alimentos ultraprocesados.',
                            'Mantén horarios regulares para tus comidas y una alimentación variada, adaptada a tu tolerancia.',
                            'Hidrátate bien a lo largo del día, evitando beber en exceso durante las comidas.',
                            'Realiza actividad física moderada de forma regular, ya que favorece la motilidad y el bienestar general.'
                        ],
                        'icon': 'checkmark-circle'
                    },
                    {
                        'id': 'seguimiento_medico',
                        'title': '¿Y si en algún momento aparecen síntomas?',
                        'content': 'Si en el futuro experimentas ardor, acidez, molestias digestivas, tos persistente o sensación de reflujo, te recomendamos repetir los cuestionarios y valorar una consulta médica si los síntomas persisten.',
                        'icon': 'hospital-user'
                    },
                    {
                        'id': 'recordatorio',
                        'title': 'Recuerda',
                        'content': 'Aunque ahora no presentes síntomas, cuidar tus hábitos es la mejor forma de mantener tu sistema digestivo en equilibrio. La salud digestiva va más allá de la ausencia de molestias: influye en tu energía, tu bienestar diario y tu salud general a largo plazo. Por eso, te animamos a utilizar GastroAssistant para identificar qué áreas puedes reforzar y empezar a trabajar en hábitos que te ayuden a mantenerte bien hoy y prevenir problemas en el futuro.',
                        'icon': 'checkmark-circle'
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
            'gastritis': {
                'title': 'Gastritis',
                'content': 'Como presentas signos de gastritis, vamos a iniciar con un enfoque más suave para proteger tu estómago. Priorizaremos alimentos fáciles de digerir, ritmos tranquilos al comer y algunas pautas específicas que favorecen la regeneración digestiva.',
                'tools': 'Alimentación suave, protección gástrica, evitar irritantes.',
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
            'intestinal': {
                'title': 'Alteraciones intestinales',
                'content': 'Has indicado que tienes una alteración digestiva como SIBO, disbiosis intestinal o síndrome del intestino irritable (SII). Estas condiciones pueden provocar distensión abdominal y aumentar la presión dentro del sistema digestivo, lo que en algunos casos agrava los síntomas de reflujo.',
                'tools': 'Seguimiento médico especializado, pautas para reducir gases, estrategias para mejorar motilidad.',
                'icon': 'pending-actions'
            },
            'h_pylori_active': {
                'title': 'H. pylori activo',
                'content': 'Se ha identificado una infección activa por Helicobacter pylori. Es fundamental que sigas el tratamiento pautado por tu médico para erradicarla de forma eficaz. Mientras tanto, aplicaremos recomendaciones enfocadas en reducir la irritación gástrica.',
                'tools': 'Tratamiento médico, alimentación suave, evitar irritantes.',
                'icon': 'stomach'
            },
            'h_pylori_treated': {
                'title': 'H. pylori tratado',
                'content': 'Aunque ya trataste la infección por Helicobacter pylori, es común que persista cierta sensibilidad digestiva durante un tiempo. Por eso, es importante seguir las pautas que refuercen tu salud digestiva y apoyen tu proceso de recuperación.',
                'tools': 'Alimentación progresiva, seguimiento de recuperación, refuerzo de salud intestinal.',
                'icon': 'stomach'
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
            },
            # 🔥 NUEVOS: SMOKING y ALCOHOL
            'smoking': {
                'title': 'Tabaquismo y reflujo',
                'content': 'Fumar reduce la presión del esfínter esofágico inferior, enlentece el aclaramiento del ácido y disminuye la producción de saliva protectora. Cuanto más tiempo se mantiene el hábito, mayor suele ser la frecuencia e intensidad de los síntomas. Dejar de fumar no solo mejora el reflujo, sino que también favorece la digestión y la salud intestinal a medio y largo plazo.',
                'tools': 'Plan de cesación tabáquica, estrategias para fortalecer el esfínter esofágico, técnicas para mejorar el aclaramiento esofágico.',
                'icon': 'psychology'
            },
            'alcohol': {
                'title': 'Consumo de alcohol y digestión',
                'content': 'El alcohol puede relajar el esfínter esofágico inferior, facilitar el paso del ácido al esófago y dañar la mucosa digestiva. Esto es más evidente en consumos altos o frecuentes. En muchas personas actúa como desencadenante directo de síntomas, especialmente si se combina con comidas copiosas o cenas tardías. Reducir su consumo puede ayudarte a mejorar los síntomas y proteger tu sistema digestivo a largo plazo.',
                'tools': 'Reducción progresiva del consumo, identificación de desencadenantes, alternativas saludables, estrategias para proteger la mucosa digestiva.',
                'icon': 'psychology'
            }
        }
        
        applicable_factors = []
        
        # Verificar qué factores aplican al usuario
        if getattr(profile, 'has_hernia', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['hernia'])
        
        if getattr(profile, 'has_gastritis', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['gastritis'])
        
        if getattr(profile, 'has_altered_motility', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['motility'])
        
        if getattr(profile, 'has_slow_emptying', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['emptying'])
        
        if getattr(profile, 'has_dry_mouth', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['saliva'])
        
        if getattr(profile, 'has_constipation', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['constipation'])
        
        if getattr(profile, 'has_intestinal_disorders', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['intestinal'])
        
        # H. pylori
        h_pylori_status = getattr(profile, 'h_pylori_status', 'NO')
        if h_pylori_status == 'ACTIVE':
            applicable_factors.append(clinical_factors_content['h_pylori_active'])
        elif h_pylori_status == 'TREATED':
            applicable_factors.append(clinical_factors_content['h_pylori_treated'])
        
        if getattr(profile, 'stress_affects', 'NO') == 'YES':
            applicable_factors.append(clinical_factors_content['stress_yes'])
        elif getattr(profile, 'stress_affects', 'NO') == 'SOMETIMES':
            applicable_factors.append(clinical_factors_content['stress_sometimes'])
        
        if getattr(profile, 'has_excess_weight', False):
            applicable_factors.append(clinical_factors_content['bmi_high'])
        
        # 🔥 NUEVO: Leer SMOKING y ALCOHOL de UserHabitAnswer
        try:
            from questionnaires.models import UserHabitAnswer
            
            # 1. 🚬 SMOKING - Pregunta 4
            smoking_answer = UserHabitAnswer.objects.filter(
                user=obj.user,
                question__habit_type='SMOKING',
                is_onboarding=True
            ).first()
            
            if smoking_answer:
                smoking_value = smoking_answer.selected_option.value
                # Si fuma (valores 0 o 1 = "Sí, todos los días" o "Sí, ocasionalmente")
                if smoking_value in [0, 1]:
                    applicable_factors.append(clinical_factors_content['smoking'])
            
            # 2. 🍷 ALCOHOL - Pregunta 5
            alcohol_answer = UserHabitAnswer.objects.filter(
                user=obj.user,
                question__habit_type='ALCOHOL',
                is_onboarding=True
            ).first()
            
            if alcohol_answer:
                alcohol_value = alcohol_answer.selected_option.value
                # Si bebe alcohol (valores 0, 1, 2 = "Sí, frecuentemente", "Sí, a veces", "Muy ocasionalmente")
                if alcohol_value in [0, 1, 2]:
                    applicable_factors.append(clinical_factors_content['alcohol'])
                    
        except Exception as e:
            print(f"❌ Error al leer hábitos SMOKING/ALCOHOL en serializer: {str(e)}")
        
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